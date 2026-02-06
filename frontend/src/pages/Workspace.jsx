import { useState, useCallback } from 'react'
import VoiceAgent from '../components/VoiceAgent'
import CodeEditor from '../components/CodeEditor'
import FileExplorer from '../components/FileExplorer'

/**
 * Workspace Page Component
 * IDE-like layout with:
 * - Left: File Explorer
 * - Center: Code Editor
 * - Right: Voice Agent Panel
 */
function Workspace() {
    // State for generated files
    const [files, setFiles] = useState({})
    // Currently active/selected file
    const [activeFile, setActiveFile] = useState(null)
    // Generation status
    const [status, setStatus] = useState('idle') // idle | listening | processing | generating | complete
    // Current transcript
    const [transcript, setTranscript] = useState('')

    /**
     * Handle voice transcript submission
     * Sends transcript to backend and processes SSE stream
     */
    const handleTranscriptSubmit = useCallback(async (text) => {
        setTranscript(text)
        setStatus('processing')
        setFiles({})
        setActiveFile(null)

        try {
            // Connect to SSE endpoint for streaming code generation
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcript: text }),
            })

            if (!response.ok) {
                throw new Error('Generation failed')
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            setStatus('generating')

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') {
                            setStatus('complete')
                            continue
                        }

                        try {
                            const event = JSON.parse(data)

                            if (event.type === 'file_start') {
                                // New file starting
                                setActiveFile(event.filename)
                                setFiles(prev => ({
                                    ...prev,
                                    [event.filename]: ''
                                }))
                            } else if (event.type === 'code_chunk') {
                                // Append code chunk to current file
                                setFiles(prev => ({
                                    ...prev,
                                    [event.filename]: (prev[event.filename] || '') + event.content
                                }))
                            } else if (event.type === 'file_complete') {
                                // File generation complete
                                console.log(`File complete: ${event.filename}`)
                            } else if (event.type === 'status') {
                                // Status update
                                console.log(`Status: ${event.message}`)
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE data:', e)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Generation error:', error)
            setStatus('idle')
        }
    }, [])

    /**
     * Handle file selection from explorer
     */
    const handleFileSelect = useCallback((filename) => {
        setActiveFile(filename)
    }, [])

    /**
     * Launch preview - opens generated site in new tab
     */
    const handleLaunchPreview = useCallback(async () => {
        try {
            const response = await fetch('/api/preview/launch', {
                method: 'POST',
            })
            const data = await response.json()
            if (data.url) {
                window.open(data.url, '_blank')
            }
        } catch (error) {
            console.error('Failed to launch preview:', error)
        }
    }, [])

    return (
        <div className="workspace">
            {/* Header */}
            <header className="workspace-header">
                <div className="logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">Split AI</span>
                </div>
                <div className="workspace-actions">
                    {status === 'complete' && (
                        <button className="launch-button" onClick={handleLaunchPreview}>
                            🚀 Launch Project
                        </button>
                    )}
                </div>
            </header>

            {/* Main IDE Layout */}
            <div className="workspace-main">
                {/* Left Panel - File Explorer */}
                <aside className="panel file-explorer-panel">
                    <FileExplorer
                        files={files}
                        activeFile={activeFile}
                        onFileSelect={handleFileSelect}
                    />
                </aside>

                {/* Center Panel - Code Editor */}
                <main className="panel editor-panel">
                    <CodeEditor
                        filename={activeFile}
                        content={files[activeFile] || ''}
                        isGenerating={status === 'generating'}
                    />
                </main>

                {/* Right Panel - Voice Agent */}
                <aside className="panel voice-agent-panel">
                    <VoiceAgent
                        status={status}
                        setStatus={setStatus}
                        transcript={transcript}
                        onTranscriptSubmit={handleTranscriptSubmit}
                    />
                </aside>
            </div>
        </div>
    )
}

export default Workspace
