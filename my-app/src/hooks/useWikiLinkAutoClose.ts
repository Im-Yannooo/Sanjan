import { useCallback } from 'react'

export function useWikiLinkAutoClose(
  onChange: (newValue: string) => void,
) {
  return useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      const el = e.currentTarget
      const { selectionStart, selectionEnd, value } = el

      if (selectionStart !== selectionEnd) return false

      const cursor = selectionStart

      const isInsideWikiLink = () => {
        const before = value.slice(0, cursor)
        const open = before.lastIndexOf('[[')
        const close = before.lastIndexOf(']]')
        return open > close && value.slice(cursor, cursor + 2) === ']]'
      }

      //
      // [[ -> [[|]]
      //
        // 1) "[" + "[" -> auto-insert "]]", caret lands in the middle
        if (e.key === '[' && value[selectionStart - 1] === '[') {
        e.preventDefault()

        // Insert the second "[" ourselves, followed by "]]"
        const newValue =
            value.slice(0, selectionStart) +
            '[]]' +
            value.slice(selectionStart)

        onChange(newValue)

        requestAnimationFrame(() => {
            // Caret between [[ and ]]
            el.setSelectionRange(selectionStart + 1, selectionStart + 1)
        })

        return true
        }

      //
      // Space -> leave wiki link
      //
      if (e.key === ' ' && isInsideWikiLink()) {
        e.preventDefault()

        let next = value
        let pos = cursor

        // Remove accidental trailing space before ]]
        if (next[cursor - 1] === ' ') {
          next =
            next.slice(0, cursor - 1) +
            next.slice(cursor)

          pos--
        }

        next =
          next.slice(0, pos + 2) +
          ' ' +
          next.slice(pos + 2)

        onChange(next)

        queueMicrotask(() => {
          el.setSelectionRange(pos + 3, pos + 3)
        })

        return true
      }

      //
      // Enter -> leave wiki link then newline
      //
      if (e.key === 'Enter' && isInsideWikiLink()) {
        e.preventDefault()

        let next = value
        let pos = cursor

        if (next[cursor - 1] === ' ') {
          next =
            next.slice(0, cursor - 1) +
            next.slice(cursor)

          pos--
        }

        next =
          next.slice(0, pos + 2) +
          '\n' +
          next.slice(pos + 2)

        onChange(next)

        queueMicrotask(() => {
          el.setSelectionRange(pos + 3, pos + 3)
        })

        return true
      }

      return false
    },
    [onChange],
  )
}