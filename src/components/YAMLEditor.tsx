import React, { useEffect, useRef, useCallback } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { keymap, placeholder as placeholderExtension } from '@codemirror/view'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { searchKeymap } from '@codemirror/search'
import { Decoration, type DecorationSet } from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'
import { parseValidationErrors, isStructuralError, formatErrorTooltip } from '@/utils/editorUtils'

interface ValidationMessage {
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface YAMLEditorProps {
  value: string
  onChange: (value: string) => void
  validationMessages?: ValidationMessage[]
  placeholder?: string
  theme?: 'light' | 'dark'
  readOnly?: boolean
  className?: string
  onValidate?: () => void // Callback for Ctrl+S validation
}

// State effect for updating error decorations
const addErrorDecorations = StateEffect.define<DecorationSet>()

// State field for managing error decorations
const errorDecorations = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (let effect of tr.effects) {
      if (effect.is(addErrorDecorations)) {
        decorations = effect.value
      }
    }
    return decorations
  },
  provide: f => EditorView.decorations.from(f)
})

// Create decoration marks for different error types
const createErrorMark = (error: any) => Decoration.mark({
  class: isStructuralError(error.message) ? 'cm-error-highlight-structural' : 'cm-error-highlight',
  attributes: {
    title: formatErrorTooltip(error)
  }
})

const createWarningMark = (error: any) => Decoration.mark({
  class: 'cm-warning-highlight',
  attributes: {
    title: formatErrorTooltip(error)
  }
})

const createInfoMark = (error: any) => Decoration.mark({
  class: 'cm-info-highlight',
  attributes: {
    title: formatErrorTooltip(error)
  }
})

export const YAMLEditor: React.FC<YAMLEditorProps> = ({
  value,
  onChange,
  validationMessages = [],
  placeholder = 'Enter YAML here...',
  theme = 'light',
  readOnly = false,
  className = '',
  onValidate
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  
  // Parse validation messages into editor errors
  const errors = parseValidationErrors(validationMessages)
  
  // Create keyboard shortcut handler
  const createKeymapExtension = useCallback(() => {
    const shortcuts: any[] = []
    
    if (onValidate) {
      shortcuts.push({
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          onValidate()
          return true
        }
      })
    }
    
    return keymap.of(shortcuts)
  }, [onValidate])

  useEffect(() => {
    if (!editorRef.current) return

    // Create initial state
    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        yaml(),
        theme === 'dark' ? oneDark : [],
        errorDecorations,
        createKeymapExtension(),
        keymap.of(searchKeymap),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString()
            onChange(newValue)
          }
        }),
        EditorView.contentAttributes.of({
          'aria-label': 'YAML input',
          'role': 'textbox'
        }),
        EditorState.readOnly.of(readOnly),
        EditorView.theme({
          '&': {
            fontSize: '14px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          },
          '.cm-content': {
            padding: '16px',
            minHeight: '360px'
          },
          '.cm-focused': {
            outline: '2px solid hsl(var(--ring))',
            outlineOffset: '2px'
          },
          '.cm-editor': {
            borderRadius: 'calc(var(--radius) - 2px)'
          },
          '.cm-scroller': {
            lineHeight: '1.6'
          },
          '.cm-error-highlight': {
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderBottom: '2px wavy rgb(239, 68, 68)'
          },
          '.cm-warning-highlight': {
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            borderBottom: '2px wavy rgb(245, 158, 11)'
          },
          '.cm-error-highlight-structural': {
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
            borderBottom: '2px solid rgb(239, 68, 68)',
            fontWeight: 'bold'
          },
          '.cm-info-highlight': {
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderBottom: '1px dotted rgb(59, 130, 246)'
          },
          '&.cm-editor.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
            backgroundColor: 'hsl(var(--accent))'
          }
        }),
        EditorView.baseTheme({
          '.cm-placeholder': {
            color: 'hsl(var(--muted-foreground))',
            fontStyle: 'italic'
          }
        }),
        // Use proper CodeMirror placeholder extension
        placeholder ? placeholderExtension(placeholder) : []
      ]
    })

    // Create editor view
    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [theme, readOnly, placeholder, onValidate]) // Recreate editor when these change

  // Update content when value prop changes externally
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value
        }
      })
    }
  }, [value])

  // Update error decorations when errors change
  useEffect(() => {
    if (!viewRef.current) return

    const decorations: any[] = []
    const doc = viewRef.current.state.doc

    errors.forEach(error => {
      if (error.line && error.line <= doc.lines) {
        try {
          const line = doc.line(error.line)
          const from = line.from + (error.column ? Math.max(0, error.column - 1) : 0)
          const to = error.column ? 
            Math.min(line.to, from + 10) : // Highlight ~10 characters from the error position
            line.to // Highlight entire line if no column specified

          const mark = error.severity === 'warning' 
            ? createWarningMark(error)
            : error.severity === 'info'
              ? createInfoMark(error)
              : createErrorMark(error)
              
          decorations.push(mark.range(from, to))
        } catch (e) {
          // Ignore invalid line/column positions
          console.warn('Invalid error position:', error)
        }
      }
    })

    const decorationSet = Decoration.set(decorations.sort((a, b) => a.from - b.from))
    
    viewRef.current.dispatch({
      effects: addErrorDecorations.of(decorationSet)
    })
  }, [errors])

  return (
    <div 
      ref={editorRef} 
      className={`
        border border-input bg-background rounded-md 
        focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
        ${className}
      `} 
    />
  )
}