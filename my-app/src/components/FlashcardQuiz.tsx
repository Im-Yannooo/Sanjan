// src/components/FlashcardQuiz.tsx
import React, { useState } from 'react'
import type { Flashcard } from '../services/geminiService'
import '../styles/FlashcardQuiz.css'

interface FlashcardQuizProps {
  cards: Flashcard[]
  isLoading: boolean
  error: string | null
  onGenerate: () => void
  noteTitle: string
}

function FlashcardQuiz({ cards, isLoading, error, onGenerate, noteTitle }: FlashcardQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answeredCorrect, setAnsweredCorrect] = useState<Set<number>>(new Set())
  const [isFinished, setIsFinished] = useState(false)

  const total = cards.length
  const current = cards[currentIndex]

  const goNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
      setFlipped(false)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setFlipped(false)
    }
  }

  const markCorrect = () => {
    setAnsweredCorrect((prev) => {
      const next = new Set(prev)
      next.add(currentIndex)
      return next
    })
    if (currentIndex === total - 1) {
      setIsFinished(true)
    } else {
      goNext()
    }
  }

  const restart = () => {
    setCurrentIndex(0)
    setFlipped(false)
    setAnsweredCorrect(new Set())
    setIsFinished(false)
  }

  // ── Empty / loading / error states ──
  if (isLoading) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-loading">
          <div className="flashcard-spinner" />
          <p>Generating flashcards from "{noteTitle}"…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flashcard-container">
        <p className="ai-error">{error}</p>
        <button className="flashcard-generate-btn" onClick={onGenerate}>
          Try Again
        </button>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-empty">
          <div className="flashcard-empty-icon">🃏</div>
          <p>Generate flashcards from your note to quiz yourself.</p>
          <button className="flashcard-generate-btn" onClick={onGenerate}>
            Generate Flashcards
          </button>
        </div>
      </div>
    )
  }

  // ── Quiz complete ──
  if (isFinished || (total > 0 && answeredCorrect.size === total)) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-complete">
          <div className="flashcard-complete-icon">🎉</div>
          <h3>All Done!</h3>
          <p>
            You got <strong>{answeredCorrect.size}</strong> / <strong>{total}</strong> correct.
          </p>
          <div className="flashcard-complete-actions">
            <button className="flashcard-generate-btn" onClick={restart}>
              Restart Quiz
            </button>
            <button className="flashcard-generate-btn secondary" onClick={onGenerate}>
              New Cards
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Active card ──
  return (
    <div className="flashcard-container">
      <div className="flashcard-progress">
        <div className="flashcard-progress-bar">
          <div
            className="flashcard-progress-fill"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
        <span className="flashcard-progress-text">
          {currentIndex + 1} / {total}
        </span>
      </div>

      <div className={`flashcard-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
        <div className="flashcard-card-inner">
          <div className="flashcard-face flashcard-front">
            <span className="flashcard-label">Question</span>
            <p className="flashcard-text">{current?.question}</p>
            <span className="flashcard-hint">Tap to reveal answer</span>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="flashcard-label">Answer</span>
            <p className="flashcard-text">{current?.answer}</p>
          </div>
        </div>
      </div>

      <div className="flashcard-actions">
        <button className="flashcard-nav-btn" onClick={goPrev} disabled={currentIndex === 0}>
          ← Prev
        </button>
        {flipped && (
          <button className="flashcard-correct-btn" onClick={markCorrect}>
            ✓ Got it
          </button>
        )}
        {currentIndex === total - 1 ? (
          <button className="flashcard-nav-btn" onClick={() => setIsFinished(true)}>
            Finish →
          </button>
        ) : (
          <button className="flashcard-nav-btn" onClick={goNext}>
            Next →
          </button>
        )}
      </div>

      <div className="flashcard-bottom-bar">
        <button className="flashcard-generate-btn secondary small" onClick={onGenerate}>
          Regenerate
        </button>
      </div>
    </div>
  )
}

export default FlashcardQuiz
