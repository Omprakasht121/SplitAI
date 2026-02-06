/**
 * CodeEditor Component
 * Displays generated code with:
 * - File tab header
 * - Syntax-highlighted code display
 * - "Typing" effect during generation
 */
function CodeEditor({ filename, content, isGenerating }) {
    /**
     * Get file icon based on extension
     */
    const getFileIcon = (name) => {
        if (!name) return '📄'
        if (name.endsWith('.html')) return '🌐'
        if (name.endsWith('.css')) return '🎨'
        if (name.endsWith('.js')) return '⚡'
        return '📄'
    }

    /**
     * Simple syntax highlighting for HTML/CSS/JS
     * Returns an array of line objects with syntax classes
     */
    const highlightCode = (code, filename) => {
        if (!code) return []

        const lines = code.split('\n')
        const extension = filename?.split('.').pop() || 'txt'

        return lines.map((line, index) => ({
            number: index + 1,
            content: line,
            type: extension
        }))
    }

    const highlightedLines = highlightCode(content, filename)

    return (
        <div className="code-editor">
            {/* Editor Header */}
            <div className="editor-header">
                {filename ? (
                    <div className="file-tab active">
                        <span className="file-icon">{getFileIcon(filename)}</span>
                        <span className="file-name">{filename}</span>
                        {isGenerating && <span className="generating-indicator">●</span>}
                    </div>
                ) : (
                    <div className="file-tab placeholder">
                        <span>No file selected</span>
                    </div>
                )}
            </div>

            {/* Code Display Area */}
            <div className="editor-content">
                {!filename ? (
                    <div className="editor-placeholder">
                        <div className="placeholder-icon">🎤</div>
                        <p>Speak your website idea to start generating code</p>
                    </div>
                ) : (
                    <div className="code-container">
                        {/* Line Numbers */}
                        <div className="line-numbers">
                            {highlightedLines.map((line) => (
                                <div key={line.number} className="line-number">
                                    {line.number}
                                </div>
                            ))}
                        </div>

                        {/* Code Content */}
                        <pre className="code-content">
                            {highlightedLines.map((line) => (
                                <div key={line.number} className={`code-line code-${line.type}`}>
                                    {line.content || ' '}
                                </div>
                            ))}
                            {isGenerating && <span className="typing-cursor">▌</span>}
                        </pre>
                    </div>
                )}
            </div>

            {/* Editor Footer */}
            <div className="editor-footer">
                <span className="file-type">
                    {filename ? filename.split('.').pop().toUpperCase() : 'N/A'}
                </span>
                <span className="line-count">
                    Lines: {highlightedLines.length}
                </span>
            </div>
        </div>
    )
}

export default CodeEditor
