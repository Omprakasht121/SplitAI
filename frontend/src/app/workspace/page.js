"use client"

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Folder, FileCode, FileText, Settings, ChevronDown, ChevronRight,
    Mic, MicOff, MoreHorizontal, Rocket, Share2, RefreshCw, X,
    FolderOpen, Loader2, Image as ImageIcon, Brain, Sparkles, Cpu, Zap, ArrowRight,
    Eye, Columns, Code2, Trash2, FilePlus, Check, Copy, Download
} from 'lucide-react'
import { 
    generateWebsite, launchPreview, generatePlan, editProject, 
    createProject, saveFile, API_BASE_URL 
} from '@/lib/api'
import PlanEditor from '@/components/PlanEditor'

// Helper to reliably generate the preview HTML by injecting CSS and JS
const generatePreviewHTML = (files) => {
    let html = files['index.html'] || '<div style="font-family: sans-serif; padding: 2rem; color: #4B5563; text-align: center;">No index.html generated yet. Ask Split AI to build something!</div>'
    const css = files['style.css'] || ''
    const js = files['script.js'] || ''
    
    // Inject CSS
    if (css) {
        if (html.includes('</head>')) {
            html = html.replace('</head>', `<style>${css}</style></head>`)
        } else {
            html = `<style>${css}</style>` + html
        }
    }

    // Inject JS
    if (js) {
        if (html.includes('</body>')) {
            html = html.replace('</body>', `<script>${js}</script></body>`)
        } else {
            html = html + `<script>${js}</script>`
        }
    }
    
    return html
}

// Initial empty state
const initialFiles = {}

// File tree structure helper
const buildFileTree = (files) => {
    const tree = []
    const paths = Object.keys(files)

    paths.forEach(path => {
        const parts = path.split('/')
        let currentLevel = tree

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1
            const existingNode = currentLevel.find(node => node.name === part)

            if (existingNode) {
                if (isFile) {
                    // Start of file logic, handled separately if needed
                } else {
                    currentLevel = existingNode.children
                }
            } else {
                const newNode = {
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    path: isFile ? path : undefined,
                    children: isFile ? undefined : [],
                    expanded: true
                }
                currentLevel.push(newNode)
                if (!isFile) {
                    currentLevel = newNode.children
                }
            }
        })
    })

    // Wrap in project root
    return [{
        name: 'Project',
        type: 'folder',
        expanded: true,
        children: tree
    }]
}

// Syntax highlighting helper - simple token-based approach
function highlightCode(code, filename) {
    if (!code) return []
    const lines = code.split('\n')
    const keywords = ['import', 'export', 'default', 'function', 'return', 'const', 'let', 'var', 'if', 'else', 'from', 'class', 'extends', 'async', 'await', 'try', 'catch', 'throw', 'new', 'true', 'false', 'null']

    return lines.map((line, idx) => {
        // Escape HTML first
        let result = ''
        let i = 0

        while (i < line.length) {
            // Check for strings
            if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
                const quote = line[i]
                let end = i + 1
                while (end < line.length && line[end] !== quote) {
                    if (line[end] === '\\') end++
                    end++
                }
                const str = line.substring(i, end + 1)
                    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
                result += `<span style="color:#fcd34d">${str}</span>`
                i = end + 1
                continue
            }

            // Check for comments
            if (line.substring(i, i + 2) === '//') {
                const comment = line.substring(i).replace(/</g, '&lt;').replace(/>/g, '&gt;')
                result += `<span style="color:#6b7280">${comment}</span>`
                break
            }

            // Check for JSX comments {/* */}
            if (line.substring(i, i + 3) === '{/*') {
                const endComment = line.indexOf('*/}', i)
                if (endComment !== -1) {
                    const comment = line.substring(i, endComment + 3).replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    result += `<span style="color:#6b7280">${comment}</span>`
                    i = endComment + 3
                    continue
                }
            }

            // Check for JSX tags
            if (line[i] === '<') {
                let end = i + 1
                const isClosing = line[end] === '/'
                if (isClosing) end++

                // Get tag name
                let tagStart = end
                while (end < line.length && /[\w.]/.test(line[end])) end++
                const tagName = line.substring(tagStart, end)

                if (tagName) {
                    result += `<span style="color:#9ca3af">${isClosing ? '&lt;/' : '&lt;'}</span>`
                    result += `<span style="color:#22d3ee">${tagName}</span>`
                    i = end
                    continue
                }
            }

            // Check for closing >
            if (line[i] === '>') {
                result += `<span style="color:#9ca3af">&gt;</span>`
                i++
                continue
            }
            if (line.substring(i, i + 2) === '/>') {
                result += `<span style="color:#9ca3af">/&gt;</span>`
                i += 2
                continue
            }

            // Check for keywords and identifiers
            if (/[a-zA-Z_]/.test(line[i])) {
                let end = i
                while (end < line.length && /[\w]/.test(line[end])) end++
                const word = line.substring(i, end)

                if (keywords.includes(word)) {
                    result += `<span style="color:#c084fc">${word}</span>`
                } else if (/^[A-Z]/.test(word)) {
                    result += `<span style="color:#22d3ee">${word}</span>`
                } else {
                    result += word
                }
                i = end
                continue
            }

            // Escape < and > that aren't part of tags
            if (line[i] === '<') {
                result += '&lt;'
            } else if (line[i] === '>') {
                result += '&gt;'
            } else {
                result += line[i]
            }
            i++
        }

        return { num: idx + 1, content: result || '&nbsp;' }
    })
}

function WorkspaceContent() {
    const searchParams = useSearchParams()
    const hasInitialized = useRef(false)

    const [files, setFiles] = useState(initialFiles)
    const [activeFile, setActiveFile] = useState(null)
    const [openTabs, setOpenTabs] = useState([])
    const [viewMode, setViewMode] = useState('code') // 'code', 'split', 'preview'
    const [newFileName, setNewFileName] = useState('')
    const [isCreatingNewFile, setIsCreatingNewFile] = useState(false)
    const newFileInputRef = useRef(null)
    const [isListening, setIsListening] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [statusMessage, setStatusMessage] = useState('Ready')
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hi! I'm Split AI. Describe the website you want to build, and I'll generate a plan for you.", tags: ['Ready'] }
    ])
    const [plan, setPlan] = useState(null)
    const [isPlanning, setIsPlanning] = useState(false)
    const [projectName, setProjectName] = useState('New Project')
    const [projectId, setProjectId] = useState(null)
    const [user, setUser] = useState(null)
    const [cursorPosition] = useState({ line: 1, col: 1 })
    const [imageBase64, setImageBase64] = useState(null)
    const [planningTime, setPlanningTime] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState(null)
    const [config, setConfig] = useState({
        model: 'gemini-1.5-pro',
        autoSave: true,
        theme: 'dark'
    })
    const codeContainerRef = useRef(null)
    const recognitionRef = useRef(null)

    // Timer for planning phase
    useEffect(() => {
        let interval
        if (isPlanning && !plan) {
            setPlanningTime(0)
            interval = setInterval(() => {
                setPlanningTime(prev => Number((prev + 0.1).toFixed(1)))
            }, 100)
        } else {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [isPlanning, plan])

    // Load settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('split_settings')
        if (savedSettings) {
            try {
                setConfig(JSON.parse(savedSettings))
            } catch (e) { /* ignore */ }
        }
    }, [])

    // Load Project
    useEffect(() => {
        const loadInitialData = async () => {
            // Get user info
            const userData = localStorage.getItem('user')
            if (userData) {
                try {
                    setUser(JSON.parse(userData))
                } catch (e) {
                    console.error("Failed to parse user data")
                }
            }

            // Check for pending image from dashboard
            const pendingImage = localStorage.getItem('pending_design_image')
            if (pendingImage) {
                setImageBase64(pendingImage)
                localStorage.removeItem('pending_design_image')
            }

            const projId = searchParams.get('project')
            if (projId && !projectId) {
                setProjectId(projId)
                try {
                    const { fetchProjectDetails } = await import('@/lib/api')
                    const data = await fetchProjectDetails(projId)
                    setProjectName(data.name)
                    
                    // Priority 1: Check LocalStorage for the latest session data
                    const cachedFiles = localStorage.getItem(`split_files_${projId}`)
                    const cachedPlan = localStorage.getItem(`split_plan_${projId}`)
                    
                    if (cachedFiles) {
                        try {
                            const parsedFiles = JSON.parse(cachedFiles)
                            if (Object.keys(parsedFiles).length > 0) {
                                setFiles(parsedFiles)
                                if (cachedPlan) setPlan(JSON.parse(cachedPlan))
                                // Auto-open the first file so editor is not blank
                                const firstFile = Object.keys(parsedFiles)[0]
                                setActiveFile(firstFile)
                                setOpenTabs([firstFile])
                            }
                        } catch (e) {
                            console.error("Failed to parse cached files")
                        }
                    } else if (data.files && Object.keys(data.files).length > 0) {
                        // Priority 2: Load from Database if no local cache
                        setFiles(data.files)
                        // Also cache to localStorage for future fast loads
                        localStorage.setItem(`split_files_${projId}`, JSON.stringify(data.files))
                        // Auto-open the first file
                        const firstFile = Object.keys(data.files)[0]
                        setActiveFile(firstFile)
                        setOpenTabs([firstFile])
                        if (data.plan_json) {
                            try {
                                setPlan(JSON.parse(data.plan_json))
                            } catch(e) { /* ignore */ }
                        }
                    } else {
                        // Priority 3: No files anywhere, check project metadata for refresh recovery
                        if (data.prompt) setTranscript(data.prompt)
                        if (data.design_image) setImageBase64(data.design_image)
                        
                        const prompt = searchParams.get('prompt')
                        if ((prompt || data.prompt) && !hasInitialized.current) {
                            hasInitialized.current = true
                            setTimeout(() => {
                                const finalPrompt = prompt || data.prompt
                                setTranscript(finalPrompt)
                                handleConfirm(finalPrompt)
                            }, 500)
                        }
                    }
                } catch (e) {
                    console.error("Failed to load project", e)
                }
            } else if (!projId) {
                // No project ID, just check for prompt (fallback)
                const prompt = searchParams.get('prompt')
                if (prompt && !hasInitialized.current) {
                    hasInitialized.current = true
                    setTimeout(() => {
                        setTranscript(prompt)
                        handleConfirm(prompt)
                    }, 500)
                }
            }
        }
        loadInitialData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    // Open file handler
    const openFile = (path) => {
        if (files[path] !== undefined) {
            setActiveFile(path)
            if (!openTabs.includes(path)) {
                setOpenTabs([...openTabs, path])
            }
        }
    }

    // Close tab handler
    const closeTab = (path, e) => {
        e.stopPropagation()
        const newTabs = openTabs.filter(t => t !== path)
        setOpenTabs(newTabs)
        if (activeFile === path && newTabs.length > 0) {
            setActiveFile(newTabs[newTabs.length - 1])
        } else if (newTabs.length === 0) {
            setActiveFile(null)
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            setImageBase64(reader.result)
        }
        reader.readAsDataURL(file)
    }

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (typeof window === 'undefined') return

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.")
            return
        }

        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
        } else {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true

            recognition.onresult = (event) => {
                let interimTranscript = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    interimTranscript += event.results[i][0].transcript
                }
                setTranscript(interimTranscript)
            }

            recognition.onend = () => setIsListening(false)
            recognitionRef.current = recognition
            recognition.start()
            setIsListening(true)
        }
    }, [isListening])

    // Generate Code Handler
    const handleConfirm = async (overridePrompt) => {
        const text = typeof overridePrompt === 'string' ? overridePrompt : transcript
        if (!text?.trim()) return

        // Update UI state
        setMessages(prev => [...prev, { role: 'user', text: text }])
        setIsListening(false)
        recognitionRef.current?.stop()

        // Check if we are editing existing files
        const hasFiles = Object.keys(files).length > 0

        if (hasFiles) {
            // EDIT MODE
            setIsGenerating(true)
            setStatusMessage('Updating Project...')
            setMessages(prev => [...prev, { role: 'ai', text: "I'm updating your project based on your request...", isLoading: true }])

            await editProject(
                projectId,
                files,
                text,
                imageBase64,
                (event) => {
                    // Reuse generation event handlers
                    switch (event.type) {
                        case 'status':
                            setStatusMessage(event.message)
                            break
                        case 'file_start':
                        case 'code_chunk':
                            // Update files state same as generation
                            if (event.type === 'file_start') {
                                setFiles(prev => {
                                    const next = { ...prev, [event.filename]: prev[event.filename] || '' }
                                    localStorage.setItem(`split_files_${projectId}`, JSON.stringify(next))
                                    return next
                                })
                                if (!openTabs.includes(event.filename)) setOpenTabs(prev => [...prev, event.filename])
                                setActiveFile(event.filename)
                            } else {
                                setFiles(prev => {
                                    const next = { ...prev, [event.filename]: (prev[event.filename] || '') + event.content }
                                    // Throttle or just save on file_complete? 
                                    // For now, save every chunk for maximum persistence
                                    localStorage.setItem(`split_files_${projectId}`, JSON.stringify(next))
                                    return next
                                })
                            }
                            break
                        case 'file_complete':
                            setStatusMessage(`Updated ${event.filename}`)
                            break
                        case 'error':
                            console.error("Edit Error:", event.message)
                            setStatusMessage(`Error: ${event.message}`)
                            setMessages(prev => [...prev, { role: 'ai', text: `Error: ${event.message}`, tags: ['Error'] }])
                            setIsGenerating(false)
                            break
                    }
                },
                (error) => {
                    console.error("Edit error:", error)
                    setStatusMessage("Error updating code")
                    setIsGenerating(false)
                    setMessages(prev => [...prev, { role: 'ai', text: "Sorry, something went wrong during the update.", tags: ['Error'] }])
                },
                () => {
                    console.log("Edit complete")
                    setStatusMessage("Ready")
                    setIsGenerating(false)
                    setTranscript('')
                    setMessages(prev => {
                        const msgs = prev.filter(m => !m.isLoading)
                        return [...msgs, { role: 'ai', text: "Update complete! Let me know if you need anything else.", tags: ['Success'] }]
                    })
                }
            )
            return
        }

        // CREATE MODE (Planning Phase)
        setIsPlanning(true)
        setStatusMessage('Creating Plan...')
        setMessages(prev => [...prev, { role: 'ai', text: "Analyzing your request and creating a plan...", isLoading: true }])

        try {
            const generatedPlan = await generatePlan(transcript, imageBase64)
            // console.log(transcript);
            // console.log(generatedPlan)
            setPlan(generatedPlan)
            setStatusMessage('Plan Ready')
            // Persistent storage for plan
            if (projectId) {
                localStorage.setItem(`split_plan_${projectId}`, JSON.stringify(generatedPlan))
            }
            setMessages(prev => {
                const msgs = prev.filter(m => !m.isLoading)
                return [...msgs, { role: 'ai', text: "I've created a plan. Please review it before we build.", tags: ['Plan Ready'] }]
            })
        } catch (error) {
            console.error("Planning error:", error)
            setStatusMessage("Planning Failed")
            setIsPlanning(false)
            setMessages(prev => {
                const msgs = prev.filter(m => !m.isLoading)
                return [...msgs, { role: 'ai', text: "Sorry, I couldn't create a plan. Please try again.", tags: ['Error'] }]
            })
        }
    }

    const ensureProjectIsSaved = async () => {
        // Capture dynamic state
        let currentId = projectId || searchParams.get('project')
        
        if (currentId) return currentId // Already saved

        // Not saved yet — check authentication
        if (!user) {
            setStatusMessage('Login required to save and download')
            setTimeout(() => setStatusMessage('Ready'), 4000)
            throw new Error('User not authenticated')
        }

        setStatusMessage('Auto-saving project...')
        try {
            // 1. Create the project record
            const resp = await createProject(projectName || 'My Split AI Project')
            const newId = resp.id
            setProjectId(newId)
            
            // Update URL without refreshing to maintain state
            const url = new URL(window.location)
            url.searchParams.set('project', newId)
            window.history.pushState({}, '', url)

            // 2. Sync files to the new project entry
            setStatusMessage('Syncing files to backend...')
            const fileOps = Object.entries(files).map(([name, content]) => 
                saveFile(newId, name, content)
            )
            await Promise.all(fileOps)
            
            setStatusMessage('Project saved!')
            return newId
        } catch (e) {
            console.error('Auto-save failed:', e)
            
            // Handle session expiration specifically
            if (e.message.includes('401') || e.message.includes('403') || e.message.toLowerCase().includes('token') || e.message.toLowerCase().includes('authorize')) {
                setStatusMessage('Session expired. Please login again.')
                // Optional: redirect to login or clear user state after a delay
            } else {
                setStatusMessage(`Save failed: ${e.message}`)
            }
            
            setTimeout(() => setStatusMessage('Ready'), 5000)
            throw e
        }
    }

    const handleProceed = async (finalPlan) => {
        setPlan(finalPlan)
        setIsPlanning(false)
        setIsGenerating(true)
        setStatusMessage('Initializing Build...')

        // Capture projId directly from URL — avoids stale React state closure bug
        const projId = searchParams.get('project') || projectId

        await generateWebsite(
            null, // No transcript, use plan
            finalPlan,
            projId,
            imageBase64,
            (event) => {
                // Handle SSE Events
                switch (event.type) {
                    case 'status':
                        setStatusMessage(event.message)
                        setMessages(prev => {
                            const last = prev[prev.length - 1]
                            if (last.role === 'ai' && last.isLoading) {
                                return [...prev.slice(0, -1), { role: 'ai', text: event.message, isLoading: true }]
                            }
                            return [...prev, { role: 'ai', text: event.message, isLoading: true }]
                        })
                        break

                    case 'file_start':
                        setFiles(prev => {
                            const next = { ...prev, [event.filename]: prev[event.filename] || '' }
                            // Save to localStorage immediately so file is not lost on refresh
                            if (projId) localStorage.setItem(`split_files_${projId}`, JSON.stringify(next))
                            return next
                        })
                        if (!openTabs.includes(event.filename)) {
                            setOpenTabs(prev => [...prev, event.filename])
                        }
                        setActiveFile(event.filename)
                        break

                    case 'code_chunk':
                        setFiles(prev => {
                            const next = {
                                ...prev,
                                [event.filename]: (prev[event.filename] || '') + event.content
                            }
                            // Always persist — projId is from URL, never stale
                            if (projId) localStorage.setItem(`split_files_${projId}`, JSON.stringify(next))
                            return next
                        })
                        break

                    case 'file_complete':
                        setStatusMessage(`Completed ${event.filename}`)
                        break

                    case 'error':
                        console.error("Server Error:", event.message)
                        setStatusMessage(`Error: ${event.message}`)
                        setIsGenerating(false)
                        setMessages(prev => [...prev, { role: 'ai', text: `Error: ${event.message}`, tags: ['Error'] }])
                        break
                }
            },
            (error) => {
                console.error("Generation error:", error)
                setStatusMessage("Error generating code")
                setIsGenerating(false)
                setMessages(prev => [...prev, { role: 'ai', text: "Sorry, something went wrong during generation.", tags: ['Error'] }])
            },
            () => {
                console.log("Generation complete")
                setStatusMessage("Ready")
                setIsGenerating(false)
                setTranscript('')
                setMessages(prev => [...prev, { role: 'ai', text: "Generation complete! Check out your new files.", tags: ['Success'] }])
            }
        )
    }

    const saveTimeoutRef = useRef(null)

    const handleCodeChange = (newCode) => {
        if (!activeFile) return
        
        // Update local state immediately (triggers live preview re-render)
        const updatedFiles = {
            ...files,
            [activeFile]: newCode
        }
        setFiles(updatedFiles)
        
        // Always persist to localStorage immediately (no projectId required)
        const storageKey = projectId ? `split_files_${projectId}` : 'split_files_unsaved'
        localStorage.setItem(storageKey, JSON.stringify(updatedFiles))

        // Debounce saving to backend (only when project is saved)
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(async () => {
            if (projectId && activeFile) {
                setStatusMessage('Saving...')
                try {
                    const { saveFile } = await import('@/lib/api')
                    await saveFile(projectId, activeFile, newCode)
                    setStatusMessage('Saved ✓')
                    setTimeout(() => setStatusMessage('Ready'), 2000)
                } catch(e) {
                    setStatusMessage('Save failed')
                    setTimeout(() => setStatusMessage('Ready'), 3000)
                }
            }
        }, 800)
    }

    // Launch Preview / Deploy Handler
    const handleLaunch = async () => {
        try {
            await ensureProjectIsSaved()
            
            setStatusMessage('Deploying to local preview...')
            const { url } = await launchPreview()
            
            if (url) {
                window.open(url, '_blank')
                setStatusMessage('Live preview opened!')
            } else {
                throw new Error('No URL returned from preview server')
            }
        } catch (e) {
            if (e.message !== 'User not authenticated') {
                console.error('Launch failed', e)
                setStatusMessage('Deployment failed')
            }
        } finally {
            setTimeout(() => setStatusMessage('Ready'), 3000)
        }
    }

    // Refresh Files Handler
    const handleDownloadProject = async () => {
        try {
            const currentId = await ensureProjectIsSaved()
            
            setStatusMessage('Preparing ZIP...')
            const link = document.createElement('a')
            link.href = `${API_BASE_URL}/api/projects/${currentId}/download`
            link.download = `${projectName.replace(/\s+/g, '_')}.zip`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setStatusMessage('Download started!')
        } catch (e) {
            if (e.message !== 'User not authenticated') {
                console.error('Export failed', e)
                setStatusMessage('Export failed')
            }
        } finally {
            setTimeout(() => setStatusMessage('Ready'), 3000)
        }
    }

    const handleRefresh = async () => {
        if (!projectId || isRefreshing) return
        
        setIsRefreshing(true)
        setStatusMessage('Syncing files...')
        
        try {
            const { fetchProjectDetails } = await import('@/lib/api')
            const data = await fetchProjectDetails(projectId)
            
            if (data.files && Object.keys(data.files).length > 0) {
                setFiles(data.files)
                localStorage.setItem(`split_files_${projectId}`, JSON.stringify(data.files))
                setStatusMessage('Files synced')
                
                // If active file was deleted/renamed, clear it
                if (activeFile && !data.files[activeFile]) {
                    setActiveFile(null)
                    setOpenTabs(prev => prev.filter(t => t !== activeFile))
                }
            } else {
                setStatusMessage('No files found')
            }
        } catch (e) {
            console.error("Refresh failed:", e)
            setStatusMessage('Sync failed')
        } finally {
            setIsRefreshing(false)
            // Reset status after delay
            setTimeout(() => setStatusMessage('Ready'), 3000)
        }
    }

    const handleClearCache = () => {
        if (window.confirm("Are you sure you want to clear the local cache for this project? This will reset local versions to the last saved backend state.")) {
            if (projectId) {
                localStorage.removeItem(`split_files_${projectId}`)
                localStorage.removeItem(`split_plan_${projectId}`)
                handleRefresh()
                setShowSettings(false)
            }
        }
    }

    const updateConfig = (newConfig) => {
        const updated = { ...config, ...newConfig }
        setConfig(updated)
        localStorage.setItem('split_settings', JSON.stringify(updated))
    }

    // Render file tree recursively
    const renderFileTree = (items, depth = 0) => {
        return items.map((item, idx) => (
            <div key={idx}>
                <div
                    className={`group flex items-center gap-1.5 py-1 px-2 hover:bg-white/5 cursor-pointer text-sm ${
                        item.type === 'file' && activeFile === item.path ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
                    }`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => item.type === 'file' && openFile(item.path)}
                >
                    {/* Icon */}
                    {item.type === 'folder' ? (
                        <>
                            {item.expanded
                                ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                : <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />}
                            {item.expanded
                                ? <FolderOpen className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                                : <Folder className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                        </>
                    ) : (
                        <>
                            <span className="w-3.5 flex-shrink-0" />
                            <FileCode className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        </>
                    )}

                    {/* Name */}
                    <span className="flex-1 truncate text-xs">{item.name}</span>

                    {/* Delete button — only on files, visible on group hover */}
                    {item.type === 'file' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteFile(item.path) }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-all flex-shrink-0"
                            title={`Delete ${item.name}`}
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {item.type === 'folder' && item.expanded && item.children && (
                    renderFileTree(item.children, depth + 1)
                )}
            </div>
        ))
    }

    const handleDeleteFile = async (filename) => {
        if (!window.confirm(`Delete "${filename}" permanently?`)) return

        // Update local state immediately
        const updatedFiles = { ...files }
        delete updatedFiles[filename]
        setFiles(updatedFiles)

        // Clear from tabs & active file
        setOpenTabs(prev => prev.filter(t => t !== filename))
        if (activeFile === filename) setActiveFile(null)

        // Persist locally
        if (projectId) {
            localStorage.setItem(`split_files_${projectId}`, JSON.stringify(updatedFiles))
        }

        // Sync backend deletion
        try {
            const { deleteFile } = await import('@/lib/api')
            await deleteFile(projectId, filename)
            setStatusMessage(`Deleted ${filename}`)
        } catch (e) {
            console.error('Failed to delete from backend:', e)
            setStatusMessage('Delete sync failed — local only')
        } finally {
            setTimeout(() => setStatusMessage('Ready'), 2500)
        }
    }

    const commitNewFile = () => {
        const name = newFileName.trim()
        if (!name) { setIsCreatingNewFile(false); return }
        setFiles(prev => ({ ...prev, [name]: '' }))
        openFile(name)
        if (projectId) {
            const updated = { ...files, [name]: '' }
            localStorage.setItem(`split_files_${projectId}`, JSON.stringify(updated))
        }
        setNewFileName('')
        setIsCreatingNewFile(false)
        setStatusMessage(`Created ${name}`)
        setTimeout(() => setStatusMessage('Ready'), 2000)
    }

    const handleBreadcrumbClick = (idx) => {
        // Construct partial path
        const parts = activeFile.split('/')
        const partialPath = parts.slice(0, idx + 1).join('/')
        
        // Copy to clipboard
        navigator.clipboard.writeText(partialPath).then(() => {
            setStatusMessage(`Copied: ${partialPath}`)
            setTimeout(() => setStatusMessage('Ready'), 2000)
        }).catch(err => {
            console.error('Failed to copy path: ', err)
        })
    }

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url).then(() => {
            setStatusMessage('Project link copied to clipboard!')
            setTimeout(() => setStatusMessage('Ready'), 3000)
        }).catch(err => {
            console.error('Failed to copy: ', err)
        })
    setActiveDropdown(null)
    }

    const handleNewFile = () => {
        const fileName = window.prompt("Enter new file name (e.g., styles.css):")
        if (fileName && fileName.trim()) {
            setFiles(prev => ({
                ...prev,
                [fileName.trim()]: ''
            }))
            openFile(fileName.trim())
            setStatusMessage(`Created ${fileName}`)
        }
        setActiveDropdown(null)
    }

    const handleClearHistory = () => {
        if (window.confirm("Clear all chat history?")) {
            setMessages([{ role: 'ai', text: "Hi! I'm Split AI. Describe the website you want to build, and I'll generate a plan for you.", tags: ['Ready'] }])
            setActiveDropdown(null)
        }
    }

    const handleQuickAction = (template) => {
        setTranscript(template)
        setActiveDropdown(null)
    }

    const handleCopyCode = () => {
        if (!currentCode) return
        navigator.clipboard.writeText(currentCode).then(() => {
            setStatusMessage('Code copied to clipboard!')
            setTimeout(() => setStatusMessage('Ready'), 2000)
        }).catch(err => {
            console.error('Failed to copy code: ', err)
        })
    }

    const handleDownloadCode = () => {
        if (!currentCode || !activeFile) return
        const blob = new Blob([currentCode], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = activeFile.split('/').pop() || 'file.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setStatusMessage(`Downloaded ${activeFile.split('/').pop()}`)
        setTimeout(() => setStatusMessage('Ready'), 2000)
    }

    const fileTree = buildFileTree(files)
    const currentCode = activeFile ? files[activeFile] : ''
    // Only highlight if we have content
    const highlightedCode = currentCode ? highlightCode(currentCode, activeFile) : []
    const breadcrumb = activeFile ? activeFile.split('/') : []

    // Auto-scroll code area during generation
    useEffect(() => {
        if (codeContainerRef.current && isGenerating) {
            codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight
        }
    }, [highlightedCode, isGenerating])

    return (
        <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden">
            {/* Top Header Bar */}
            <header className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    {/* Logo and Project */}
                    <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all">
                            <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <span className="font-semibold text-white text-sm">Split AI Workspace</span>
                    </Link>

                    {/* Branch/Project Name */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-gray-500">main</span>
                        <span className="text-gray-600">•</span>
                        <span>{projectName}</span>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex items-center gap-1 ml-4 relative">
                        {['File', 'Edit', 'View', 'Go', 'Run', 'Terminal'].map(item => (
                            <div key={item} className="relative">
                                <button 
                                    onClick={() => setActiveDropdown(activeDropdown === item ? null : item)}
                                    className={`px-3 py-1 text-xs transition-colors rounded ${activeDropdown === item ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {item}
                                </button>
                                
                                {activeDropdown === item && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-[#161b22] border border-white/10 rounded-lg shadow-2xl z-[110] py-1">
                                        {item === 'File' ? (
                                            <>
                                                <button onClick={handleNewFile} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white flex items-center gap-2">
                                                    <FileCode className="w-3.5 h-3.5" /> New File...
                                                </button>
                                                <button onClick={() => { if(projectId) window.location.href = `http://127.0.0.1:8000/api/projects/${projectId}/download`; setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white flex items-center gap-2">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    Export as ZIP
                                                </button>
                                                <div className="h-[1px] bg-white/5 my-1" />
                                                <button onClick={() => { setStatusMessage('Auto-save is active'); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-white/5 flex items-center justify-between">
                                                    <span>Save</span> <span className="text-[10px] opacity-50">Ctrl+S</span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-widest text-center">
                                                {item} Coming Soon
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* View Controls */}
                    <div className="flex items-center bg-[#0d1117] rounded-lg p-0.5 border border-[#30363d] mr-2">
                        <button
                            onClick={() => setViewMode('code')}
                            className={`p-1.5 rounded-md transition-all flex items-center justify-center ${viewMode === 'code' ? 'bg-[#30363d] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Code Only"
                        >
                            <Code2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewMode(viewMode === 'split' ? 'code' : 'split')}
                            className={`p-1.5 rounded-md transition-all flex items-center justify-center ${viewMode === 'split' ? 'bg-[#30363d] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Toggle Live Sandbox"
                        >
                            <Columns className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`p-1.5 rounded-md transition-all flex items-center justify-center ${viewMode === 'preview' ? 'bg-[#30363d] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Preview Only"
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button
                        onClick={handleLaunch}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Rocket className="w-3.5 h-3.5" />
                        Deploy
                    </button>
                    <button 
                        onClick={handleDownloadProject}
                        className="flex items-center gap-2 bg-[#21262d] text-white text-xs font-medium px-4 py-1.5 rounded-lg border border-[#30363d] hover:bg-[#30363d] transition-colors"
                    >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        Download ZIP
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center cursor-pointer shadow-lg shadow-pink-500/20">
                        <span className="text-white text-xs font-bold">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - File Explorer */}
                <aside className="w-56 bg-[#0d1117] border-r border-[#30363d] flex flex-col flex-shrink-0">
                    {/* Explorer Header */}
                    <div className="px-3 py-2 flex items-center justify-between border-b border-[#30363d]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Explorer</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    setIsCreatingNewFile(true)
                                    setTimeout(() => newFileInputRef.current?.focus(), 50)
                                }}
                                className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                                title="New File"
                            >
                                <FilePlus className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                                title="Refresh Files"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* File Tree */}
                    <div className="flex-1 overflow-y-auto py-1">
                        {/* Inline new-file input */}
                        {isCreatingNewFile && (
                            <div className="flex items-center gap-1 px-2 py-1 mx-2 mb-1 bg-[#21262d] border border-blue-500/50 rounded-lg">
                                <FileCode className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                <input
                                    ref={newFileInputRef}
                                    value={newFileName}
                                    onChange={e => setNewFileName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') commitNewFile()
                                        if (e.key === 'Escape') { setIsCreatingNewFile(false); setNewFileName('') }
                                    }}
                                    placeholder="filename.html"
                                    className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-600"
                                />
                                <button onClick={commitNewFile} className="text-green-400 hover:text-green-300 transition-colors">
                                    <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => { setIsCreatingNewFile(false); setNewFileName('') }} className="text-gray-500 hover:text-white transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        {renderFileTree(fileTree)}
                    </div>

                    {/* Settings */}
                    <div className="p-3 border-t border-[#30363d]">
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full px-2 py-1.5 hover:bg-white/5 rounded transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                    </div>
                </aside>

                {/* Center - Code Editor */}
                <main className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex bg-[#161b22] border-b border-[#30363d]">
                        {openTabs.map(tab => {
                            const tabName = tab.split('/').pop()
                            const isActive = tab === activeFile
                            return (
                                <div
                                    key={tab}
                                    onClick={() => setActiveFile(tab)}
                                    className={`flex items-center gap-2 px-4 py-2 text-xs cursor-pointer border-r border-[#30363d] ${isActive
                                        ? 'bg-[#0d1117] text-white border-t-2 border-t-blue-500'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                                    {tabName}
                                    <button
                                        onClick={(e) => closeTab(tab, e)}
                                        className="ml-1 hover:bg-white/10 rounded p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    {/* Breadcrumb & Utilities */}
                    <div className="px-4 py-2 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            {breadcrumb.map((part, idx) => {
                                const isLast = idx === breadcrumb.length - 1
                                return (
                                    <span key={idx} className="flex items-center gap-2 group">
                                        {idx > 0 && <ChevronRight className="w-3 h-3 text-gray-700" />}
                                        <button 
                                            onClick={() => handleBreadcrumbClick(idx)}
                                            className={`hover:text-white hover:bg-white/5 px-1.5 py-0.5 rounded transition-all flex items-center gap-1 ${isLast ? 'text-gray-300 font-medium' : ''}`}
                                            title={`Copy path: ${breadcrumb.slice(0, idx + 1).join('/')}`}
                                        >
                                            {isLast ? <FileText className="w-3 h-3 text-blue-400" /> : <Folder className="w-3 h-3 text-gray-500" />}
                                            {part}
                                        </button>
                                    </span>
                                )
                            })}
                        </div>
                        
                        {activeFile && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleCopyCode}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-tight"
                                    title="Copy Code"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                </button>
                                <button
                                    onClick={handleDownloadCode}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-tight"
                                    title="Download File"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Workspace Core Area */}
                    <div className="flex-1 flex overflow-hidden relative">

                        {/* ── Welcome Card ── shown when workspace is fresh (no files yet) */}
                        {!isPlanning && !isGenerating && Object.keys(files).length === 0 && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#0d1117', overflow: 'hidden'
                            }}>
                                {/* Floating ambient orbs */}
                                <div style={{ position:'absolute', top:'12%', left:'8%', width:'340px', height:'340px', background:'radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 65%)', borderRadius:'50%', animation:'wc-float 7s ease-in-out infinite' }} />
                                <div style={{ position:'absolute', bottom:'18%', right:'10%', width:'270px', height:'270px', background:'radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 65%)', borderRadius:'50%', animation:'wc-float 9s ease-in-out infinite reverse' }} />
                                <div style={{ position:'absolute', top:'55%', left:'58%', width:'180px', height:'180px', background:'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)', borderRadius:'50%', animation:'wc-float 6s ease-in-out 2s infinite' }} />

                                {/* Subtle grid */}
                                <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize:'44px 44px', WebkitMaskImage:'radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 100%)' }} />

                                {/* Card */}
                                <div style={{ position:'relative', background:'linear-gradient(145deg, rgba(22,27,34,0.98) 0%, rgba(13,17,23,1) 100%)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'28px', padding:'52px 48px', maxWidth:'540px', width:'90%', textAlign:'center', boxShadow:'0 0 90px rgba(59,130,246,0.09), 0 0 40px rgba(139,92,246,0.06), 0 30px 70px rgba(0,0,0,0.65)', animation:'wc-card-in 0.55s cubic-bezier(0.16,1,0.3,1) forwards' }}>

                                    {/* Top shimmer line */}
                                    <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px', background:'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), rgba(59,130,246,0.7), transparent)' }} />

                                    {/* Icon with pulse rings */}
                                    <div style={{ position:'relative', display:'inline-block', marginBottom:'32px' }}>
                                        <div style={{ position:'absolute', top:'-20px', left:'-20px', right:'-20px', bottom:'-20px', border:'1px solid rgba(59,130,246,0.22)', borderRadius:'50%', animation:'wc-pulse 2.8s ease-out infinite' }} />
                                        <div style={{ position:'absolute', top:'-10px', left:'-10px', right:'-10px', bottom:'-10px', border:'1px solid rgba(59,130,246,0.38)', borderRadius:'50%', animation:'wc-pulse 2.8s ease-out 0.65s infinite' }} />
                                        <div style={{ width:'88px', height:'88px', background:'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 45px rgba(59,130,246,0.38), inset 0 1px 0 rgba(255,255,255,0.18)', animation:'wc-float 3.5s ease-in-out infinite' }}>
                                            <Sparkles style={{ width:'42px', height:'42px', color:'white' }} />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h2 style={{ fontSize:'26px', fontWeight:700, color:'white', marginBottom:'10px', letterSpacing:'-0.4px', animation:'wc-fade-up 0.55s ease-out 0.1s both' }}>
                                        Start Building with{' '}
                                        <span style={{ background:'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Split AI</span>
                                    </h2>

                                    {/* Subtitle */}
                                    <p style={{ color:'#6b7280', fontSize:'14px', lineHeight:'1.65', marginBottom:'32px', animation:'wc-fade-up 0.55s ease-out 0.2s both' }}>
                                        Describe the website you want to build in the chat.<br/>
                                        AI will plan, write the code, and preview it live.
                                    </p>

                                    {/* Feature pills */}
                                    <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginBottom:'30px', animation:'wc-fade-up 0.55s ease-out 0.3s both' }}>
                                        {[
                                            { icon:'⚡', label:'Instant Generation' },
                                            { icon:'👁', label:'Live Preview' },
                                            { icon:'🧠', label:'Gemini Powered' },
                                            { icon:'📱', label:'Mobile Ready' }
                                        ].map((pill, i) => (
                                            <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 13px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'999px', fontSize:'12px', color:'#9ca3af', animationDelay:`${0.35 + i * 0.07}s` }}>
                                                <span>{pill.icon}</span><span>{pill.label}</span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Quick start prompts */}
                                    <div style={{ marginBottom:'30px', animation:'wc-fade-up 0.55s ease-out 0.5s both' }}>
                                        <p style={{ fontSize:'10px', color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px', fontWeight:600 }}>Quick Start</p>
                                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center' }}>
                                            {[
                                                'SaaS landing page',
                                                'Portfolio website',
                                                'E-commerce page',
                                                'Admin dashboard'
                                            ].map((prompt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setTranscript(prompt)}
                                                    style={{ padding:'7px 15px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.22)', borderRadius:'10px', fontSize:'12px', color:'#93c5fd', cursor:'pointer', transition:'all 0.2s ease', animationDelay:`${0.55 + i * 0.07}s` }}
                                                    onMouseEnter={e => { e.currentTarget.style.background='rgba(59,130,246,0.18)'; e.currentTarget.style.borderColor='rgba(59,130,246,0.45)'; e.currentTarget.style.color='#bfdbfe' }}
                                                    onMouseLeave={e => { e.currentTarget.style.background='rgba(59,130,246,0.08)'; e.currentTarget.style.borderColor='rgba(59,130,246,0.22)'; e.currentTarget.style.color='#93c5fd' }}
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bottom hint */}
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', color:'#374151', fontSize:'12px', animation:'wc-fade-up 0.55s ease-out 0.7s both' }}>
                                        <span>Type your idea in the chat panel on the right</span>
                                        <ArrowRight style={{ width:'12px', height:'12px' }} />
                                    </div>

                                    {/* Bottom shine line */}
                                    <div style={{ position:'absolute', bottom:0, left:'15%', right:'15%', height:'1px', background:'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }} />
                                </div>

                                <style>{`
                                    @keyframes wc-float {
                                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                                        50%        { transform: translateY(-14px) rotate(1.5deg); }
                                    }
                                    @keyframes wc-pulse {
                                        0%   { transform: scale(0.82); opacity: 0.9; }
                                        100% { transform: scale(1.55); opacity: 0; }
                                    }
                                    @keyframes wc-card-in {
                                        from { opacity: 0; transform: translateY(28px) scale(0.96); }
                                        to   { opacity: 1; transform: translateY(0)   scale(1); }
                                    }
                                    @keyframes wc-fade-up {
                                        from { opacity: 0; transform: translateY(14px); }
                                        to   { opacity: 1; transform: translateY(0); }
                                    }
                                `}</style>
                            </div>
                        )}

                        {isPlanning && !plan ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/90 backdrop-blur-sm z-50">
                                <div className="bg-[#161b22] border border-white/10 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden group">
                                    {/* Animated Background Glow */}
                                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />
                                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-all duration-1000" />
                                    
                                    <div className="relative z-10">
                                        {/* Pulse Animation */}
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                                            <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                                                <Brain className="w-10 h-10 text-white animate-bounce" />
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                                            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin-slow" />
                                            Architecting Project
                                        </h2>
                                        
                                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                            Split AI is analyzing your requirements and designing the optimal file structure...
                                        </p>

                                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col gap-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500">Processing Intent</span>
                                                <span className="text-blue-400 font-mono">{planningTime}s</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-loading-bar" style={{ width: '40%' }} />
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest justify-center mt-2">
                                                <Cpu className="w-3 h-3" />
                                                <span>Gemini Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <style jsx>{`
                                    @keyframes loading-bar {
                                        0% { transform: translateX(-100%); }
                                        100% { transform: translateX(250%); }
                                    }
                                    .animate-loading-bar {
                                        width: 40%;
                                        animation: loading-bar 2s infinite linear;
                                    }
                                    .animate-spin-slow {
                                        animation: spin 3s infinite linear;
                                    }
                                `}</style>
                            </div>
                        ) : isPlanning && plan ? (
                            <div className="absolute inset-0 z-50 bg-[#0d1117]">
                                <PlanEditor
                                    initialPlan={plan}
                                    onProceed={handleProceed}
                                    onCancel={() => {
                                        setIsPlanning(false)
                                        setPlan(null)
                                        setStatusMessage('Ready')
                                    }}
                                />
                            </div>
                        ) : null}

                        {viewMode === 'preview' ? (
                            /* Preview mode: full-screen sandbox fills the entire editor area */
                            <div className="flex flex-col w-full h-full">
                                <div className="h-8 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 gap-2 shrink-0">
                                    <div className="flex-1 text-center text-[10px] uppercase font-mono text-gray-500 tracking-wider">
                                        Live Sandbox · Full Preview
                                    </div>
                                    <button
                                        onClick={() => setViewMode('code')}
                                        className="text-gray-600 hover:text-white p-0.5 rounded transition-colors"
                                        title="Back to Editor"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <iframe
                                    srcDoc={generatePreviewHTML(files)}
                                    className="w-full flex-1 border-none bg-white"
                                    title="Live Preview"
                                    sandbox="allow-scripts allow-forms allow-same-origin"
                                />
                            </div>
                        ) : (
                            /* Code / Split mode: show the code editor */
                            <div className="flex flex-col relative overflow-hidden w-full">
                                <div
                                    ref={codeContainerRef}
                                    className="flex-1 overflow-auto font-mono text-sm relative scroll-smooth bg-[#0d1117]"
                                >
                                    {activeFile ? (
                                        <div className="relative min-h-full" style={{ minHeight: '100%' }}>
                                            <textarea
                                                value={currentCode}
                                                onChange={(e) => handleCodeChange(e.target.value)}
                                                spellCheck={false}
                                                placeholder={`// Start typing your ${activeFile.split('.').pop()?.toUpperCase() || 'code'} here...`}
                                                className="absolute top-0 left-0 w-full h-full min-h-screen bg-transparent text-transparent caret-white resize-none outline-none overflow-hidden m-0 z-10 font-mono text-sm leading-6 placeholder-gray-700"
                                                style={{ paddingLeft: '3rem' }}
                                                disabled={isGenerating}
                                            />
                                            {highlightedCode.length > 0 && (
                                                <div className="pointer-events-none absolute top-0 left-0 w-full z-0">
                                                    {highlightedCode.map(line => (
                                                        <div key={line.num} className="flex hover:bg-white/5 leading-6">
                                                            <span className="w-12 text-right pr-4 text-gray-600 select-none flex-shrink-0 pt-[1px]">
                                                                {line.num}
                                                            </span>
                                                            <pre
                                                                className="flex-1 text-gray-300 m-0 whitespace-pre"
                                                                dangerouslySetInnerHTML={{ __html: line.content || '&nbsp;' }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {highlightedCode.length === 0 && (
                                                <div className="pointer-events-none absolute top-0 left-0 w-12 z-0">
                                                    <div className="flex leading-6">
                                                        <span className="w-12 text-right pr-4 text-gray-700 select-none text-sm pt-[1px]">1</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 min-h-[300px]">
                                            <div className="mb-4 text-4xl">⚡</div>
                                            <p className="text-center">Select a file from the explorer<br/>or create one with the + button.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Bar */}
                    <div className="h-6 bg-[#0d419d] flex items-center justify-between px-4 text-xs text-white flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                {isGenerating ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                                ) : (
                                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                                )}
                                {statusMessage}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>{activeFile ? `Line ${cursorPosition.line}` : 'Ready'}</span>
                            <span>UTF-8</span>
                            <span>React</span>
                            <span>Prettier</span>
                        </div>
                    </div>
                </main>

                {/* Sandbox Panel — only in split mode, 375px mobile column */}
                {viewMode === 'split' && (
                    <div
                        className="flex flex-col flex-shrink-0 bg-[#0d1117] border-l border-[#30363d] overflow-hidden"
                        style={{ width: '375px', minWidth: '375px', maxWidth: '375px' }}
                    >
                        {/* Toolbar */}
                        <div className="h-8 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 gap-2 shrink-0">
                            <div className="flex-1 text-center text-[10px] uppercase font-mono text-gray-500 tracking-wider">
                                Live Sandbox · Mobile Preview
                            </div>
                            <button
                                onClick={() => setViewMode('code')}
                                className="text-gray-600 hover:text-white p-0.5 rounded transition-colors"
                                title="Close Sandbox"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <iframe
                            srcDoc={generatePreviewHTML(files)}
                            className="w-full flex-1 border-none bg-white"
                            title="Live Preview"
                            sandbox="allow-scripts allow-forms allow-same-origin"
                        />
                    </div>
                )}

                {/* Right Sidebar - AI Assistant */}
                <aside className="w-80 bg-[#0d1117] border-l border-[#30363d] flex flex-col flex-shrink-0">
                    {/* AI Header */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-[#30363d]">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 ${isGenerating ? 'bg-yellow-400' : 'bg-emerald-500'} rounded-full animate-pulse`} />
                            <span className="font-medium text-white text-sm">AI Assistant</span>
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setActiveDropdown(activeDropdown === 'ai-more' ? null : 'ai-more')}
                                className="text-gray-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            {activeDropdown === 'ai-more' && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-[#161b22] border border-white/10 rounded-lg shadow-2xl z-[110] py-1 overflow-hidden">
                                    <button 
                                        onClick={handleClearHistory}
                                        className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" /> Clear History
                                    </button>
                                    <button 
                                        className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                        onClick={() => { alert('Chat Exporting coming soon!'); setActiveDropdown(null); }}
                                    >
                                        <FileCode className="w-3.5 h-3.5" /> Export Chat
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>                    {/* Chat Messages - Now Flexible & Scrollable */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                                    {/* Avatar & Label */}
                                    <div className={`flex items-center gap-2 mb-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'user' ? (
                                            <>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{user?.name?.split(' ')[0] || 'You'}</span>
                                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                    <span className="text-white text-[10px]">{user?.name ? user.name.charAt(0).toUpperCase() : '👤'}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                    <Brain className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Split AI</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-[#21262d] text-gray-300 border border-white/5 rounded-tl-none'
                                        }`}>
                                        {msg.isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                                <span className="text-sm italic text-gray-400">{msg.text}</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                        )}
                                        {msg.tags && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {msg.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-white/10 text-white text-[10px] rounded uppercase tracking-wider font-bold">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Unified Input Footer */}
                    <div className="p-4 border-t border-[#30363d] bg-[#0d1117] relative">
                        {/* Listening Waves Overlay */}
                        {isListening && (
                            <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-1.5 h-12 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-blue-500 rounded-full animate-pulse"
                                        style={{
                                            height: `${Math.random() * 20 + 8}px`,
                                            animationDelay: `${i * 0.05}s`
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <div className={`relative bg-[#161b22] border rounded-2xl transition-all duration-300 group ${isListening ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-white/10 focus-within:border-white/20'}`}>
                            {/* Input Container */}
                            <div className="p-3">
                                <textarea
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleConfirm()
                                        }
                                    }}
                                    placeholder={isListening ? "Listening to your voice..." : "Ask Split AI to build or edit..."}
                                    disabled={isGenerating}
                                    className="w-full bg-transparent text-gray-200 text-sm outline-none resize-none min-h-[60px] max-h-[200px] p-1 font-sans placeholder:text-gray-600 pr-10"
                                />
                                
                                {/* Right Absolute Mic Toggle */}
                                <button
                                    onClick={toggleListening}
                                    disabled={isGenerating}
                                    className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${isListening ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Toolbar Footer */}
                            <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    {/* Design Upload */}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="unified-design-upload" 
                                        className="hidden" 
                                        onChange={handleImageUpload}
                                    />
                                    <label 
                                        htmlFor="unified-design-upload"
                                        className={`p-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${imageBase64 ? 'text-emerald-400 bg-emerald-400/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                        title="Attach Design Sketch"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        {imageBase64 && <span className="text-[10px] font-bold uppercase">Attached</span>}
                                    </label>
                                    
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveDropdown(activeDropdown === 'ai-zap' ? null : 'ai-zap')}
                                            className={`p-2 rounded-lg transition-colors ${activeDropdown === 'ai-zap' ? 'text-white bg-blue-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                            title="Quick Actions"
                                        >
                                            <Zap className="w-4 h-4" />
                                        </button>
                                        
                                        {activeDropdown === 'ai-zap' && (
                                            <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl z-[110] py-2 overflow-hidden">
                                                <p className="px-4 py-1 text-[9px] text-gray-500 uppercase tracking-widest font-bold">Quick Prompts</p>
                                                {[
                                                    { icon: Sparkles, text: "Improve UI/UX", prompt: "Can you analyze the current UI and suggest layout improvements?" },
                                                    { icon: Rocket, text: "Make Responsive", prompt: "Please ensure all components are fully responsive across mobile and desktop." },
                                                    { icon: Cpu, text: "Optimize Code", prompt: "Check for performance bottlenecks and optimize the current code." },
                                                    { icon: FileText, text: "Add Comments", prompt: "Add detailed JSDoc comments to help document this codebase." }
                                                ].map((action, i) => (
                                                    <button 
                                                        key={i}
                                                        onClick={() => handleQuickAction(action.prompt)}
                                                        className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors"
                                                    >
                                                        <action.icon className="w-3.5 h-3.5" /> {action.text}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                                        {isListening ? 'Voice Active' : isGenerating ? 'Computing...' : 'Dual mode'}
                                    </span>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={isGenerating || !transcript.trim()}
                                        className={`p-2 rounded-lg transition-all ${isGenerating || !transcript.trim() 
                                            ? 'text-gray-700 bg-white/5 cursor-not-allowed' 
                                            : 'text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20'}`}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Attached Image Preview Popover */}
                        {imageBase64 && (
                            <div className="absolute bottom-full left-4 mb-2 group">
                                <div className="p-1 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden relative">
                                        <img src={imageBase64} alt="Design Preview" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => setImageBase64(null)}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div 
                            className="absolute inset-0 bg-[#0d1117]/80 backdrop-blur-md"
                            onClick={() => setShowSettings(false)}
                        />
                        
                        <div className="relative w-full max-w-lg bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Settings className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Workspace Settings</h3>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Configuration & Preferences</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* AI Section */}
                                <section>
                                    <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Brain className="w-3 h-3" />
                                        AI Configuration
                                    </h4>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Most capable model for complex logic', icon: Sparkles, color: 'text-purple-400' },
                                            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Fastest model for rapid prototyping', icon: Zap, color: 'text-yellow-400' }
                                        ].map(model => (
                                            <div 
                                                key={model.id}
                                                onClick={() => updateConfig({ model: model.id })}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${config.model === model.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg bg-white/5 ${model.color}`}>
                                                        <model.icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{model.name}</p>
                                                        <p className="text-xs text-gray-500">{model.desc}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.model === model.id ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`}>
                                                    {config.model === model.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* System Section */}
                                <section>
                                    <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Cpu className="w-3 h-3" />
                                        System Preferences
                                    </h4>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl divide-y divide-white/5">
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-white">Auto-save on change</p>
                                                <p className="text-xs text-gray-500">Automatically persist shifts to the cloud</p>
                                            </div>
                                            <button 
                                                onClick={() => updateConfig({ autoSave: !config.autoSave })}
                                                className={`w-10 h-5 rounded-full transition-all relative ${config.autoSave ? 'bg-blue-600' : 'bg-gray-700'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.autoSave ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                {/* Project Info */}
                                <section>
                                    <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText className="w-3 h-3" />
                                        Project Metadata
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter mb-1">Project ID</p>
                                            <p className="text-xs font-mono text-gray-300 truncate">{projectId || 'N/A'}</p>
                                        </div>
                                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter mb-1">Status</p>
                                            <p className="text-xs font-mono text-emerald-400 uppercase tracking-wide">Connected</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Advanced Section */}
                                <section className="pt-4 border-t border-white/5">
                                    <button 
                                        onClick={handleClearCache}
                                        className="w-full p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Clear Local Cache
                                    </button>
                                    <p className="text-[10px] text-gray-600 text-center mt-3 leading-relaxed">
                                        Clearing cache will force the workspace to re-fetch the latest files from the server. Use this if you encounter sync issues.
                                    </p>
                                </section>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function Workspace() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen text-white bg-[#0d1117]">Loading Workspace...</div>}>
            <WorkspaceContent />
        </Suspense>
    )
}
