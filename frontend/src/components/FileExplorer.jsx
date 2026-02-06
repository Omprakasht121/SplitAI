/**
 * FileExplorer Component
 * Displays generated files in a tree-like structure
 * - Shows file icons based on type
 * - Highlights active file
 */
function FileExplorer({ files, activeFile, onFileSelect }) {
    const fileList = Object.keys(files)

    /**
     * Get file icon based on extension
     */
    const getFileIcon = (filename) => {
        if (filename.endsWith('.html')) return '🌐'
        if (filename.endsWith('.css')) return '🎨'
        if (filename.endsWith('.js')) return '⚡'
        return '📄'
    }

    return (
        <div className="file-explorer">
            <div className="explorer-header">
                <h3>📁 Files</h3>
            </div>

            <div className="explorer-content">
                {fileList.length === 0 ? (
                    <div className="explorer-empty">
                        <span className="empty-icon">📂</span>
                        <p>No files generated yet</p>
                        <p className="hint">Use voice to generate your website</p>
                    </div>
                ) : (
                    <div className="file-tree">
                        {/* Project Root */}
                        <div className="tree-item folder">
                            <span className="tree-icon">📁</span>
                            <span className="tree-label">generated-site</span>
                        </div>

                        {/* File List */}
                        {fileList.map((filename) => (
                            <div
                                key={filename}
                                className={`tree-item file ${activeFile === filename ? 'active' : ''}`}
                                onClick={() => onFileSelect(filename)}
                            >
                                <span className="tree-indent"></span>
                                <span className="tree-icon">{getFileIcon(filename)}</span>
                                <span className="tree-label">{filename}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Explorer Footer */}
            {fileList.length > 0 && (
                <div className="explorer-footer">
                    <span>{fileList.length} file(s)</span>
                </div>
            )}
        </div>
    )
}

export default FileExplorer
