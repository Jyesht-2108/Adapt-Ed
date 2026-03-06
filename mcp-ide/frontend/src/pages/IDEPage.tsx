import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Code2, Lightbulb, AlertCircle, ChevronDown, Save, Check, Play, X, Terminal as TerminalIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Editor, { OnMount } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { cn } from '@/lib/utils'
import type { ChatMessage, EditorState } from '@/types/editor'
import FileExplorer from '@/components/FileExplorer'
import Terminal from '@/components/Terminal'

const INITIAL_CODE = `// Welcome to MCP-IDE!
// This is a context-aware AI coding tutor

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
`

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content: "Welcome to the Shadow Tutor! I can see you're working on a recursive function. What would you like help with?",
  },
]

interface Model {
  id: string
  name: string
  type: string
  description: string
}

const IDEPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES)
  const [input, setInput] = useState('')
  const [code, setCode] = useState(INITIAL_CODE)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('ollama')
  const [availableModels, setAvailableModels] = useState<Model[]>([])
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')
  const [executionError, setExecutionError] = useState('')
  const [showOutput, setShowOutput] = useState(false)
  const [showFileDropdown, setShowFileDropdown] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [currentFileId, setCurrentFileId] = useState<string>('')
  const [currentProjectId, setCurrentProjectId] = useState<string>('00000000-0000-0000-0000-000000000001') // Default project
  const [showTerminal, setShowTerminal] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexStatus, setIndexStatus] = useState<string>('')
  const [lastExecutionResult, setLastExecutionResult] = useState<{
    output: string
    error: string
    timestamp: Date
  } | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true) // Default to dark mode
  const [editorState, setEditorState] = useState<EditorState>({
    file_path: 'main.js',
    language: 'javascript',
    full_code: INITIAL_CODE,
    cursor_line: 1,
    cursor_column: 1,
    selected_text: '',
    errors: [],
  })
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Helper to get language from file extension
  const getLanguageFromFile = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js': return 'javascript'
      case 'py': return 'python'
      case 'cpp': case 'cc': case 'cxx': return 'cpp'
      default: return 'javascript'
    }
  }

  const handleFileChange = (newFile: string) => {
    const language = getLanguageFromFile(newFile)
    setEditorState(prev => ({
      ...prev,
      file_path: newFile,
      language: language
    }))
    setShowFileDropdown(false)

    // Update session context in database
    if (sessionId) {
      fetch('http://localhost:8000/api/v1/tutor/session/update-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          language: language,
          file_path: newFile
        })
      }).catch(err => console.error('Failed to update session context:', err))
    }

    // Update Monaco editor language
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        const monaco = (window as any).monaco
        if (monaco) {
          monaco.editor.setModelLanguage(model, language)
        }
      }
    }
  }

  const fileOptions = [
    { name: 'main.js', icon: '📄', lang: 'JavaScript' },
    { name: 'main.py', icon: '🐍', lang: 'Python' },
    { name: 'main.cpp', icon: '⚙️', lang: 'C++' },
  ]

  // Fetch available models on mount
  useEffect(() => {
    console.log('🚀 Starting session creation...')

    // Get initial language from current file
    const initialLanguage = getLanguageFromFile(editorState.file_path)

    // Start a new session with correct language
    fetch('http://localhost:8000/api/v1/tutor/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: initialLanguage,
        file_path: editorState.file_path
      })
    })
      .then(res => {
        console.log('Session response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('Session response data:', data)
        if (data.session_id) {
          setSessionId(data.session_id)
          console.log('✅ Session started:', data.session_id)
        } else {
          console.log('❌ No session_id in response:', data)
        }
      })
      .catch(err => {
        console.error('❌ Failed to start session:', err)
      })

    // Fetch available models
    fetch('http://localhost:8000/api/v1/tutor/models')
      .then(res => res.json())
      .then(data => {
        setAvailableModels(data.models)
        if (data.models.length > 0) {
          setSelectedModel(data.models[0].id)
        }
      })
      .catch(err => {
        console.error('Failed to fetch models:', err)
        // Fallback to default
        setAvailableModels([{
          id: 'ollama',
          name: 'Llama 3 (Local)',
          type: 'local',
          description: 'Fast, private, runs on your machine'
        }])
      })
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (!isSaved && currentFileId) {
      const timer = setTimeout(() => {
        console.log('🔄 Auto-saving file...', currentFileId)
        handleSave()
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer)
    }
  }, [code, isSaved, currentFileId])

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [code])

  const handleSave = async () => {
    console.log('💾 handleSave called')
    console.log('   Current file ID:', currentFileId)
    console.log('   Code length:', code.length)

    // Save to localStorage
    localStorage.setItem('mcp-ide-code', code)
    localStorage.setItem('mcp-ide-file', editorState.file_path)
    setIsSaved(true)
    setLastSaved(new Date())

    // Save to database if we have a file ID
    if (currentFileId) {
      try {
        console.log('📤 Sending PATCH request to database...')
        const response = await fetch(`http://localhost:8000/api/v1/files/files/${currentFileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: code })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Failed to save to database:', errorText)
        } else {
          console.log('✅ File saved to database successfully')
        }
      } catch (err) {
        console.error('❌ Failed to save to database:', err)
      }
    } else {
      console.warn('⚠️ No currentFileId, skipping database save')
    }
  }

  const handleFileSelect = async (file: any) => {
    console.log('Selecting file:', file.name, 'Current file ID:', currentFileId)

    // Don't reload if clicking the same file
    if (currentFileId === file.id) {
      return
    }

    // Save current file in background (don't await)
    if (currentFileId && code) {
      fetch(`http://localhost:8000/api/v1/files/files/${currentFileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: code })
      }).catch(err => console.error('Failed to save:', err))
    }

    // Optimistically load from file object first (instant)
    setCurrentFileId(file.id)
    setCode(file.content || '')
    setEditorState(prev => ({
      ...prev,
      file_path: file.path,
      language: file.language,
      full_code: file.content || ''
    }))
    setIsSaved(true)
    setLastSaved(new Date())

    // Clear output when switching files
    setOutput('')
    setExecutionError('')
    setShowOutput(false)

    // Update Monaco editor language immediately
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        const monaco = (window as any).monaco
        if (monaco) {
          monaco.editor.setModelLanguage(model, file.language)
        }
      }
    }

    // Fetch latest content in background and update if different
    fetch(`http://localhost:8000/api/v1/files/files/${file.id}`)
      .then(res => res.json())
      .then(latestFile => {
        if (latestFile.content !== file.content) {
          console.log('Updated with latest content from database')
          setCode(latestFile.content || '')
          setEditorState(prev => ({
            ...prev,
            full_code: latestFile.content || ''
          }))
        }
      })
      .catch(err => console.error('Failed to fetch latest file content:', err))

    // Update session context in background
    if (sessionId) {
      fetch('http://localhost:8000/api/v1/tutor/session/update-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          language: file.language,
          file_path: file.path
        })
      }).catch(err => console.error('Failed to update session:', err))
    }

    // Mark as active in database
    fetch(`http://localhost:8000/api/v1/files/files/${file.id}/activate?project_id=${file.project_id}`, {
      method: 'POST'
    }).catch(err => console.error('Failed to activate file:', err))
  }

  const handleFileDelete = (deletedFileId: string) => {
    console.log('File deleted:', deletedFileId)

    // If the currently open file was deleted, clear the editor
    if (currentFileId === deletedFileId) {
      console.log('Currently open file was deleted, clearing editor')
      setCurrentFileId('')
      setCode('// File was deleted')
      setEditorState(prev => ({
        ...prev,
        file_path: '',
        full_code: '// File was deleted'
      }))
    }
  }

  const handleRunCode = async () => {
    console.log('▶️ Run Code clicked')

    // CRITICAL: Save to database BEFORE executing
    if (currentFileId && !isSaved) {
      console.log('💾 Saving file before execution...')
      try {
        const saveResponse = await fetch(`http://localhost:8000/api/v1/files/files/${currentFileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: code })
        })

        if (saveResponse.ok) {
          console.log('✅ File saved before execution')
          setIsSaved(true)
          setLastSaved(new Date())
        } else {
          console.error('❌ Failed to save before execution')
        }
      } catch (err) {
        console.error('❌ Error saving before execution:', err)
      }

      // Wait a bit for database to update
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setIsRunning(true)
    setShowOutput(true)
    setOutput('')
    setExecutionError('')

    // Detect language from file extension
    const language = getLanguageFromFile(editorState.file_path)

    try {
      console.log('🚀 Executing code...')
      const response = await fetch('http://localhost:8000/api/v1/executor/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: language,
          input: '',
          session_id: sessionId,
          file_path: editorState.file_path,
          project_id: currentProjectId  // Enable multi-file execution
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || 'Failed to execute code')
      }

      const data = await response.json()

      // Store execution result for AI context
      setLastExecutionResult({
        output: data.output || '',
        error: data.error || '',  // Complete stderr with all errors preserved
        timestamp: new Date()
      })

      if (data.error) {
        setExecutionError(data.error)
      }
      if (data.output) {
        setOutput(data.output)
      }
      if (!data.output && !data.error) {
        setOutput('(No output)')
      }
    } catch (error: any) {
      console.error('Execution error:', error)
      setExecutionError(error.message || 'Failed to execute code. Make sure the backend is running.')
    } finally {
      setIsRunning(false)
    }
  }

  // Load saved code on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('mcp-ide-code')
    const savedFile = localStorage.getItem('mcp-ide-file')

    if (savedCode) {
      setCode(savedCode)
      setEditorState(prev => ({
        ...prev,
        full_code: savedCode,
        file_path: savedFile || 'main.js'
      }))
    }
  }, [])

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setEditorState((prev) => ({
        ...prev,
        cursor_line: e.position.lineNumber,
        cursor_column: e.position.column,
      }))
    })

    // Track selection
    editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel()
      if (model) {
        const selectedText = model.getValueInRange(e.selection)
        setEditorState((prev) => ({
          ...prev,
          selected_text: selectedText,
        }))
      }
    })
  }

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || ''
    console.log('✏️ Code changed, length:', newCode.length)
    setCode(newCode)
    setIsSaved(false) // Mark as unsaved when code changes
    setEditorState((prev) => ({
      ...prev,
      full_code: newCode,
    }))
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build enhanced editor state with execution results
      const enhancedEditorState = {
        ...editorState,
        // Add execution context if available - includes complete error output
        last_execution: lastExecutionResult ? {
          output: lastExecutionResult.output,
          error: lastExecutionResult.error,  // Complete stderr with all errors
          timestamp: lastExecutionResult.timestamp.toISOString()
        } : undefined
      }

      const response = await fetch('http://localhost:8000/api/v1/tutor/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editor_state: enhancedEditorState,
          user_question: input,
          model_type: selectedModel,
          session_id: sessionId,
          project_id: currentProjectId  // Enable RAG
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: ChatMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please make sure the backend is running and try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const currentModel = availableModels.find(m => m.id === selectedModel)

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg gradient-primary">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">MCP-IDE</h1>
            <p className="text-xs text-muted-foreground">Context-Aware AI Coding Tutor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <FileExplorer
          onFileSelect={handleFileSelect}
          currentFileId={currentFileId}
          onFileDelete={handleFileDelete}
        />

        {/* Editor and Chat */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Editor Panel - NOW ON LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
              <div className="relative">
                <button
                  onClick={() => setShowFileDropdown(!showFileDropdown)}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-secondary rounded transition-colors"
                >
                  <Code2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{editorState.file_path}</span>
                  <ChevronDown className={cn(
                    "w-3 h-3 text-muted-foreground transition-transform",
                    showFileDropdown && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showFileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden min-w-[200px]"
                    >
                      {fileOptions.map((file) => (
                        <button
                          key={file.name}
                          onClick={() => handleFileChange(file.name)}
                          className={cn(
                            "w-full px-3 py-2 text-left hover:bg-secondary transition-colors flex items-center gap-2",
                            editorState.file_path === file.name && "bg-primary/10"
                          )}
                        >
                          <span>{file.icon}</span>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-foreground">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{file.lang}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {!isSaved && <span className="text-xs text-orange-500">• Unsaved</span>}
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                </button>
                <button
                  onClick={() => setShowTerminal(!showTerminal)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all",
                    showTerminal
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  )}
                >
                  <TerminalIcon className="w-3 h-3" />
                  <span>Terminal</span>
                </button>
                {lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all",
                    isSaved
                      ? "bg-green-500/10 text-green-500"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      <span>Save (Ctrl+S)</span>
                    </>
                  )}
                </button>
                <span className="text-xs text-muted-foreground">
                  Line {editorState.cursor_line}, Col {editorState.cursor_column}
                </span>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className={cn("transition-all", showOutput ? "h-[60%]" : "flex-1")}>
              <Editor
                height="100%"
                language={editorState.language}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorDidMount}
                theme={isDarkMode ? "vs-dark" : "light"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            </div>

            {/* Output Panel */}
            <AnimatePresence>
              {showOutput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '40%', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border bg-secondary/30 flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isRunning ? "bg-yellow-500 animate-pulse" : executionError ? "bg-red-500" : "bg-green-500"
                      )} />
                      <span className="text-xs font-medium text-foreground">Output</span>
                    </div>
                    <button
                      onClick={() => setShowOutput(false)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                    {executionError && (
                      <div className="text-red-400 whitespace-pre-wrap mb-2">
                        {/* Display complete error output - all errors preserved with line breaks */}
                        {executionError}
                      </div>
                    )}
                    {output && (
                      <div className="text-green-400 whitespace-pre-wrap">
                        {output}
                      </div>
                    )}
                    {isRunning && (
                      <div className="text-muted-foreground">
                        Running code...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Bar */}
            {editorState.errors.length > 0 && (
              <div className="px-4 py-2 border-t border-border bg-red-500/10 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">{editorState.errors[0]}</span>
              </div>
            )}
          </motion.div>

          {/* Tutor Chat Panel - NOW ON RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-[380px] shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg gradient-primary">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">Shadow Tutor</h3>
                  <p className="text-xs text-muted-foreground">Socratic guidance • Won't give answers</p>
                </div>
              </div>

              {/* Model Selector */}
              <div className="mt-3 relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-secondary rounded-lg text-xs hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3 h-3 text-yellow-500" />
                    <span className="text-foreground font-medium">
                      {currentModel?.name || 'Select Model'}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "w-3 h-3 text-muted-foreground transition-transform",
                    showModelDropdown && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showModelDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                    >
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id)
                            setShowModelDropdown(false)
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left hover:bg-secondary transition-colors",
                            selectedModel === model.id && "bg-primary/10"
                          )}
                        >
                          <div className="text-xs font-medium text-foreground">{model.name}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}
                >
                  <div
                    className={cn(
                      'p-1.5 rounded-lg shrink-0 h-fit',
                      msg.role === 'assistant' ? 'gradient-primary' : 'bg-secondary'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-secondary-foreground" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'rounded-xl px-3.5 py-2.5 text-sm max-w-[85%]',
                      msg.role === 'assistant'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'gradient-primary text-primary-foreground'
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2"
                >
                  <div className="p-1.5 rounded-lg gradient-primary shrink-0 h-fit">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="rounded-xl px-3.5 py-2.5 text-sm bg-secondary text-secondary-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask the tutor..."
                  disabled={isLoading}
                  className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Terminal */}
      <Terminal
        projectId={currentProjectId}
        isOpen={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </div>
  )
}

export default IDEPage
