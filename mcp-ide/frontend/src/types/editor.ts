export interface EditorState {
  file_path: string
  language: string
  full_code: string
  cursor_line: number
  cursor_column: number
  selected_text: string
  errors: string[]
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface ContextPayload extends EditorState {
  user_question: string
}
