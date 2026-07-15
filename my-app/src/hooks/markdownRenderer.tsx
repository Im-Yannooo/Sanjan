// src/utils/markdownRender.tsx
import React from 'react'

const HEADING_RE = /^(#{1,6})(\s+)/
const WIKILINK_RE = /\[\[(.*?)\]\]/g
const IMAGE_RE = /^!\[(.*?)\]\((.*?)\)$/

export function stripMdExt(title: string): string {
  return title.endsWith('.md') ? title.slice(0, -3) : title
}

export function renderWithWikiLinks(
  text: string,
  noteTitles: Set<string>,
  onWikiLinkClick?: (target: string) => void,
) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  WIKILINK_RE.lastIndex = 0

  while ((match = WIKILINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const rawTarget = match[1]

    if (rawTarget.trim() === '') {
      parts.push(match[0])
      lastIndex = match.index + match[0].length
      continue
    }

    const hasAlias = rawTarget.includes('|')
    const targetPart = hasAlias ? rawTarget.split('|')[0] : rawTarget
    const aliasPart = hasAlias ? rawTarget.split('|')[1] : null
    const targetTrimmed = targetPart.trim()
    const formatted = targetTrimmed.endsWith('.md') ? targetTrimmed : `${targetTrimmed}.md`
    const exists = noteTitles.has(formatted)

    parts.push(
      <span
        key={match.index}
        className={`wikilink-highlight ${exists ? 'exists' : 'missing'} wikilink-clickable`}
        onClick={(e) => {
          e.stopPropagation()
          onWikiLinkClick?.(targetTrimmed)
        }}
      >
        <span className="md-syntax-hidden">[[</span>
        {hasAlias ? (
          <>
            <span className="md-syntax-hidden">{targetPart}|</span>
            {aliasPart}
          </>
        ) : (
          targetPart
        )}
        <span className="md-syntax-hidden">]]</span>
      </span>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

// function renderLineWithMarkdown(
//   line: string,
//   noteTitles: Set<string>,
//   onWikiLinkClick?: (target: string) => void,
// ): React.ReactNode {
//   const headingMatch = line.match(HEADING_RE)
//   if (headingMatch) {
//     const [full, hashes, spacing] = headingMatch
//     const rest = line.slice(full.length)
//     return (
//       <span className="md-heading">
//         <span className="md-syntax-hidden">{hashes}{spacing}</span>
//         {renderWithWikiLinks(rest, noteTitles, onWikiLinkClick)}
//       </span>
//     )
//   }
//   return <>{renderWithWikiLinks(line, noteTitles, onWikiLinkClick)}</>
// }

function MarkdownImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
  }, [src]);

  if (!url) return null;

  return (
    <img
      src={`vault-file:///${src}`}
      alt={alt}
      style={{
        maxWidth: "100%",
        maxHeight: 400,
        display: "block",
      }}
    />
  );
}

function renderLineWithMarkdown(
  line: string,
  noteTitles: Set<string>,
  onWikiLinkClick?: (target: string) => void,
): React.ReactNode {

  const imageMatch = line.match(IMAGE_RE)

if (imageMatch) {
  const [, alt, src] = imageMatch;

  return (
    <img
      src={`vault-file://${src}`}
      alt={alt}
      style={{
        maxWidth: "100%",
        maxHeight: "400px",
        display: "block",
      }}
    />
  );
}

  const headingMatch = line.match(HEADING_RE)

  if (headingMatch) {
    const [full, hashes, spacing] = headingMatch
    const rest = line.slice(full.length)

    return (
      <span className="md-heading">
        <span className="md-syntax-hidden">
          {hashes}
          {spacing}
        </span>

        {renderWithWikiLinks(rest, noteTitles, onWikiLinkClick)}
      </span>
    )
  }

  return renderWithWikiLinks(line, noteTitles, onWikiLinkClick)
}

export function renderContentWithMarkdown(
  text: string,
  noteTitles: Set<string>,
  onWikiLinkClick?: (target: string) => void,
): React.ReactNode {
  return text.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && '\n'}
      {renderLineWithMarkdown(line, noteTitles, onWikiLinkClick)}
    </React.Fragment>
  ))
}