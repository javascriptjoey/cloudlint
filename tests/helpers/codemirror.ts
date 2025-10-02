import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Set text content in CodeMirror editor by clearing and typing new content
 */
export async function setCodeMirrorValue(value: string) {
  const editor = screen.getByRole('textbox', { name: /yaml input/i })
  
  // Focus the editor first
  await userEvent.click(editor)
  
  // Clear all content with Ctrl+A then type new value
  await userEvent.keyboard('{Control>}a{/Control}')
  await userEvent.type(editor, value)
  
  // Wait for any pending updates
  await new Promise(resolve => setTimeout(resolve, 10))
}

/**
 * Get current text content from CodeMirror editor by accessing the text content
 */
export function getCodeMirrorValue(): string {
  const editor = screen.getByRole('textbox', { name: /yaml input/i })
  const contentElement = editor.querySelector('.cm-content')
  return contentElement?.textContent || ''
}

/**
 * Get the CodeMirror editor root element for DOM queries (e.g., error highlights)
 */
export async function getCodeMirrorEditor(): Promise<HTMLElement> {
  const editor = screen.getByRole('textbox', { name: /yaml input/i })
  // The role element is a wrapper; the actual editor has class .cm-editor somewhere up the tree
  const cmRoot = editor.closest('.cm-editor') as HTMLElement | null
  if (cmRoot) return cmRoot
  // Fallback: query document if structure differs
  const found = document.querySelector('.cm-editor') as HTMLElement | null
  if (!found) throw new Error('CodeMirror editor root not found')
  return found
}

/**
 * Type text into CodeMirror editor (replaces existing content)
 */
export async function typeInCodeMirror(text: string) {
  await setCodeMirrorValue(text)
}

/**
 * Clear all text from CodeMirror editor
 */
export async function clearCodeMirror() {
  const editor = screen.getByRole('textbox', { name: /yaml input/i })
  
  // Focus and select all then delete
  await userEvent.click(editor)
  await userEvent.keyboard('{Control>}a{/Control}')
  await userEvent.keyboard('{Delete}')
  
  // Wait for updates
  await new Promise(resolve => setTimeout(resolve, 10))
}
