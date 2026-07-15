// my-app/src/services/geminiService.ts
//
// Central AI service for Sanjan. Wraps the official `@google/genai` SDK.
// All note data is local; this file only ever sends note titles/content
// to Google's cloud Gemini endpoint over HTTPS — nothing is persisted remotely.
//
// Requires: npm install @google/genai
// Requires: VITE_GEMINI_API_KEY set in my-app/.env (Vite exposes it via import.meta.env)

import { GoogleGenAI, Type } from '@google/genai'

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

/** A local vault note as produced by the Electron main process (see main.ts). */
export interface VaultNote {
  title: string
  content: string
}

export interface GhostSuggestion {
  /** The note title Gemini thinks should be linked (without the [[ ]]). */
  noteTitle: string
  /** Short justification Gemini gave for the link. */
  reason: string
  /** The literal string to splice into the editor, e.g. " [[Foo]] because bar." */
  insertText: string
}

export interface RelatedNoteSuggestion {
  title: string
  reason: string
  /** 0-1 relevance score so the UI can sort/threshold. */
  relevance: number
}

export type ChatRole = 'user' | 'model'

export interface ChatMessage {
  role: ChatRole
  text: string
}

export class GeminiServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'GeminiServiceError'
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Client setup
// ────────────────────────────────────────────────────────────────────────────

const MODEL_NAME = 'gemini-2.5-flash'

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (client) return client

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey) {
    throw new GeminiServiceError(
      'VITE_GEMINI_API_KEY is not set. Add it to my-app/.env (and restart the Vite dev server).',
    )
  }

  client = new GoogleGenAI({ apiKey })
  return client
}

// ────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ────────────────────────────────────────────────────────────────────────────

const LINK_PATTERN = /\[\[([^\]]+)\]\]/g

/** Pull every `[[Target]]` reference out of a note's raw markdown body. */
export function extractLinkedTitles(content: string): string[] {
  const titles = new Set<string>()
  let match: RegExpExecArray | null
  // Reset lastIndex since LINK_PATTERN is a shared module-level regex with the /g flag.
  LINK_PATTERN.lastIndex = 0
  while ((match = LINK_PATTERN.exec(content)) !== null) {
    titles.add(normalizeTitle(match[1]))
  }
  return Array.from(titles)
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim()
  return trimmed.endsWith('.md') ? trimmed.slice(0, -3) : trimmed
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}…`
}

/** Renders a compact "### Title\n<snippet>" block per note for prompt context. */
function buildVaultContext(notes: VaultNote[], maxCharsPerNote = 500): string {
  if (notes.length === 0) return '(vault is empty)'
  return notes
    .map((n) => `### ${normalizeTitle(n.title)}\n${truncate(n.content, maxCharsPerNote)}`)
    .join('\n\n')
}

/** Parses a JSON response defensively — Gemini can occasionally wrap JSON in prose/fences. */
function safeParseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fencedMatch) {
      try {
        return JSON.parse(fencedMatch[1]) as T
      } catch {
        /* fall through */
      }
    }
    return fallback
  }
}

async function reportErrorToBackend(featureType: string, err: unknown, prompt?: string) {
  const errMsg = err instanceof Error ? err.message : String(err)
  const isOutOfTokens =
    errMsg.includes('429') ||
    errMsg.toLowerCase().includes('quota') ||
    errMsg.toLowerCase().includes('exhaust') ||
    errMsg.toLowerCase().includes('rate') ||
    errMsg.toLowerCase().includes('token')

  if (isOutOfTokens) {
    const userId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000'
    try {
      await fetch('http://localhost:5123/api/v1/ai/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          featureType,
          status: 'RATE_LIMITED',
          promptUsed: prompt ? prompt.slice(0, 1000) : null,
          responseRaw: `[Token Exhaustion / Rate Limit]: ${errMsg}`,
          retryCount: 0,
          latencyMs: 0
        })
      })
    } catch (logErr) {
      console.error('Failed to log rate limit to C# backend:', logErr)
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Ghost Text — "Gap Finder"
// ────────────────────────────────────────────────────────────────────────────

const GAP_FINDER_SYSTEM_INSTRUCTION = `You are the "Gap Finder" module inside Sanjan, a local-first Obsidian-style
markdown note app. Notes link to each other using literal double-bracket syntax: [[Target Note Name]].

Your job: read the ACTIVE NOTE the user is currently writing, and the titles/content of every OTHER note in
their vault. Find at most ONE existing vault note that is highly semantically relevant to what the user is
currently writing about, but that is NOT already linked in the active note's text.

Strict rules:
- Only ever suggest a note that is present in the provided vault context. Never invent a note title.
- Never suggest a note whose title already appears as a [[Link]] in the active note (this is provided to you
  as a list of "already linked" titles — treat it as authoritative).
- Only suggest a link when the connection is genuinely useful, non-obvious is fine but it must be substantive.
  If nothing in the vault is a good fit, say so — do not force a weak suggestion.
- "reason" must be a single short clause (under 12 words), written as a continuation of the sentence
  "... because ", e.g. "it covers the same onboarding checklist in more detail".
- Output strict JSON only, matching the provided schema. No markdown fences, no commentary.`

const ghostSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    hasSuggestion: {
      type: Type.BOOLEAN,
      description: 'True only if a genuinely relevant, unlinked note exists.',
    },
    suggestedNoteTitle: {
      type: Type.STRING,
      description: 'Exact title of the suggested note, omitted/empty if hasSuggestion is false.',
    },
    reason: {
      type: Type.STRING,
      description: 'Short clause continuing "... because ". Omitted/empty if hasSuggestion is false.',
    },
  },
  required: ['hasSuggestion'],
}

interface RawGhostResponse {
  hasSuggestion: boolean
  suggestedNoteTitle?: string
  reason?: string
}

/**
 * Debounced caller should invoke this after the user pauses typing.
 * Returns null when there's nothing worth suggesting (short-circuits some
 * calls locally to save quota rather than always hitting the API).
 */
export async function getGhostSuggestion(
  activeContent: string,
  allNotes: VaultNote[],
  activeTitle?: string,
): Promise<GhostSuggestion | null> {
  const trimmed = activeContent.trim()
  if (trimmed.length < 20) return null

  const alreadyLinked = extractLinkedTitles(activeContent)
  const candidates = allNotes.filter((n) => {
    const title = normalizeTitle(n.title)
    return title !== (activeTitle ? normalizeTitle(activeTitle) : undefined) && !alreadyLinked.includes(title)
  })
  if (candidates.length === 0) return null

  const prompt = `ALREADY LINKED IN ACTIVE NOTE (do not suggest these): ${alreadyLinked.length ? alreadyLinked.join(', ') : '(none)'
    }

ACTIVE NOTE CONTENT:
"""
${truncate(trimmed, 3000)}
"""

OTHER VAULT NOTES:
${buildVaultContext(candidates)}`

  try {
    const ai = getClient()
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: GAP_FINDER_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: ghostSuggestionSchema,
        temperature: 0.3,
      },
    })

    const parsed = safeParseJson<RawGhostResponse>(response.text, { hasSuggestion: false })
    if (!parsed.hasSuggestion || !parsed.suggestedNoteTitle) return null

    const noteTitle = normalizeTitle(parsed.suggestedNoteTitle)
    const reason = (parsed.reason ?? '').trim()

    return {
      noteTitle,
      reason,
      insertText: reason ? ` [[${noteTitle}]] because ${reason}` : ` [[${noteTitle}]]`,
    }
  } catch (err) {
    await reportErrorToBackend('SEMANTIC_LINK', err, prompt)
    throw new GeminiServiceError('Failed to get ghost suggestion from Gemini.', err)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2a. Sidebar — Semantic Analytics
// ────────────────────────────────────────────────────────────────────────────

const SEMANTIC_ANALYTICS_SYSTEM_INSTRUCTION = `You are the "Semantic Analytics" module inside Sanjan.
Given an active note and the rest of the user's vault, identify up to 5 OTHER notes that are strongly related
in meaning to the active note but are NOT already linked to it via [[Note Name]] syntax.

Strict rules:
- Only reference notes that exist in the provided vault context — never invent titles.
- Never include a note title that is already in the "already linked" list.
- Order results by relevance descending.
- "relevance" is a float from 0 to 1.
- "reason" is one short sentence explaining the connection.
- Output strict JSON only, matching the schema. No markdown fences, no commentary.`

const analyticsSchema = {
  type: Type.OBJECT,
  properties: {
    relatedNotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          reason: { type: Type.STRING },
          relevance: { type: Type.NUMBER },
        },
        required: ['title', 'reason', 'relevance'],
      },
    },
  },
  required: ['relatedNotes'],
}

interface RawAnalyticsResponse {
  relatedNotes: RelatedNoteSuggestion[]
}

export async function getSemanticAnalytics(
  activeContent: string,
  allNotes: VaultNote[],
  activeTitle?: string,
): Promise<RelatedNoteSuggestion[]> {
  const alreadyLinked = extractLinkedTitles(activeContent)
  const candidates = allNotes.filter((n) => {
    const title = normalizeTitle(n.title)
    return title !== (activeTitle ? normalizeTitle(activeTitle) : undefined) && !alreadyLinked.includes(title)
  })
  if (candidates.length === 0 || activeContent.trim().length === 0) return []

  const prompt = `ALREADY LINKED IN ACTIVE NOTE: ${alreadyLinked.length ? alreadyLinked.join(', ') : '(none)'}

ACTIVE NOTE CONTENT:
"""
${truncate(activeContent.trim(), 4000)}
"""

OTHER VAULT NOTES:
${buildVaultContext(candidates)}`

  try {
    const ai = getClient()
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SEMANTIC_ANALYTICS_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: analyticsSchema,
        temperature: 0.2,
      },
    })

    const parsed = safeParseJson<RawAnalyticsResponse>(response.text, { relatedNotes: [] })
    return parsed.relatedNotes ?? []
  } catch (err) {
    await reportErrorToBackend('SEMANTIC_LINK', err, prompt)
    throw new GeminiServiceError('Failed to fetch semantic analytics from Gemini.', err)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2b. Sidebar — Flashcard Quiz
// ────────────────────────────────────────────────────────────────────────────

export interface Flashcard {
  question: string
  answer: string
}

const FLASHCARD_SYSTEM_INSTRUCTION = `You are the "Flashcard Generator" module inside Sanjan, a local-first markdown note app.
Given the content of the user's active note, generate a set of flashcard-style quiz questions and answers that
test the user's understanding of the key concepts, facts, and relationships in the note.

Strict rules:
- Generate between 3 and 8 flashcards depending on the note's length and density.
- Questions should test recall and understanding, not just trivial details.
- Answers should be concise — one or two sentences at most.
- Cover the most important concepts in the note.
- Output strict JSON only, matching the provided schema. No markdown fences, no commentary.`

const flashcardSchema = {
  type: Type.OBJECT,
  properties: {
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ['question', 'answer'],
      },
    },
  },
  required: ['flashcards'],
}

interface RawFlashcardResponse {
  flashcards: Flashcard[]
}

export async function generateFlashcards(
  activeContent: string,
  activeTitle?: string,
): Promise<Flashcard[]> {
  const trimmed = activeContent.trim()
  if (trimmed.length < 30) return []

  const prompt = `NOTE TITLE: "${activeTitle ? normalizeTitle(activeTitle) : 'Untitled'}"

NOTE CONTENT:
"""
${truncate(trimmed, 5000)}
"""

Generate flashcard quiz questions and answers based on this note.`

  try {
    const ai = getClient()
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: FLASHCARD_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: flashcardSchema,
        temperature: 0.4,
      },
    })

    const parsed = safeParseJson<RawFlashcardResponse>(response.text, { flashcards: [] })
    return parsed.flashcards ?? []
  } catch (err) {
    await reportErrorToBackend('STUDY_NOTE', err, prompt)
    throw new GeminiServiceError('Failed to generate flashcards from Gemini.', err)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2c. Sidebar — Bridge Notes
// ────────────────────────────────────────────────────────────────────────────

const BRIDGE_NOTE_SYSTEM_INSTRUCTION = `You are the "Bridge Notes" module inside Sanjan. The user has selected
several existing notes and wants a brand-new note that explains the logical intersections between them.

Strict rules:
- Output ONLY the raw markdown body of the new note. No JSON, no code fences, no preamble like "Here is your note".
- Start with a single "# " level-1 heading that names the bridge/intersection concept.
- The body must reference EVERY source note at least once using exact [[Source Note Title]] syntax.
- Keep it focused: explain the shared thread(s) and how the notes relate, not a rehash of each note's contents.
- Use normal markdown (headings, bullet lists, bold) where it aids clarity. Keep it under ~400 words.`

export async function generateBridgeNote(selectedNotes: VaultNote[]): Promise<string> {
  if (selectedNotes.length < 2) {
    throw new GeminiServiceError('Select at least two notes to generate a bridge note.')
  }

  const prompt = `SOURCE NOTES:
${buildVaultContext(selectedNotes, 1200)}

Write the bridge note now.`

  try {
    const ai = getClient()
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: BRIDGE_NOTE_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    })

    const text = response.text?.trim()
    if (!text) throw new GeminiServiceError('Gemini returned an empty bridge note.')
    return text
  } catch (err) {
    await reportErrorToBackend('BRIDGE_NOTE', err, prompt)
    if (err instanceof GeminiServiceError) throw err
    throw new GeminiServiceError('Failed to generate bridge note from Gemini.', err)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2c. Sidebar — Contextual Chat
// ────────────────────────────────────────────────────────────────────────────

const CHAT_SYSTEM_INSTRUCTION = `You are Sanjan's in-app note assistant. You are answering questions about ONE
specific active note whose full content is provided below. Ground every answer in that note's content. If the
user asks about something the note doesn't cover, say so plainly rather than inventing information. Keep
answers concise and use markdown formatting sparingly (short lists are fine, avoid headings).`

/**
 * Stateless-per-call chat: we resend the active note + trimmed history each time,
 * which keeps this simple to wire into React state without holding a live SDK
 * chat session across renders/HMR reloads.
 */
export async function chatWithNote(
  activeNote: VaultNote,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const trimmedHistory = history.slice(-12) // keep prompts small

  const contents = [
    {
      role: 'user' as const,
      parts: [
        {
          text: `ACTIVE NOTE: "${normalizeTitle(activeNote.title)}"\n"""\n${truncate(
            activeNote.content,
            6000,
          )}\n"""`,
        },
      ],
    },
    {
      role: 'model' as const,
      parts: [{ text: "Understood, I'll answer questions grounded in that note." }],
    },
    ...trimmedHistory.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ]

  try {
    const ai = getClient()
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    })

    const text = response.text?.trim()
    if (!text) throw new GeminiServiceError('Gemini returned an empty chat response.')
    return text
  } catch (err) {
    await reportErrorToBackend('STUDY_NOTE', err, userMessage)
    if (err instanceof GeminiServiceError) throw err
    throw new GeminiServiceError('Failed to get a chat response from Gemini.', err)
  }
}
