"use client"

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
    Folder, FileCode, FileText, Settings, ChevronDown, ChevronRight,
    Mic, MicOff, MoreHorizontal, Rocket, Share2, RefreshCw, X,
    FolderOpen
} from 'lucide-react'

// Sample project files
const initialFiles = {
    'src/components/Hero.tsx': `import React from 'react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative w-full h-screen bg-[#111722]
      overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-slate-800/[0.2]
        bg-[bottom_1px]" />
      <div className="absolute h-full w-full bg-gradient-to-b
        from-transparent to-[#111722]" />

      {/* Main Content Container */}
      <div className="relative container mx-auto px-6 h-full
        flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-
            white mb-6 tracking-tight">
            Welcome to <span className="text-transparent bg-
              clip-text bg-gradient-to-r from-blue-400 to-emerald-
              400">IMS Engineering College</span>
          </h1>
        </motion.div>
      </div>
    </section>
  )
}`,
    'src/components/Navbar.tsx': `import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white">
          IMS EC
        </Link>
        <div className="flex gap-6">
          <Link href="/about" className="text-gray-300 hover:text-white">About</Link>
          <Link href="/programs" className="text-gray-300 hover:text-white">Programs</Link>
          <Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link>
        </div>
      </div>
    </nav>
  )
}`,
    'src/components/Features.tsx': `import React from 'react';

const features = [
  { title: 'Modern Campus', description: 'State-of-the-art facilities' },
  { title: 'Expert Faculty', description: 'Industry experienced teachers' },
  { title: 'Research Labs', description: 'Cutting-edge technology labs' },
];

export default function Features() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why Choose Us
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="p-6 bg-slate-800 rounded-xl">
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`,
    'src/pages/index.tsx': `import Hero from '@/components/Hero';
import Navbar from '@/components/Navbar';
import Features from '@/components/Features';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
    </main>
  )
}`,
    'src/styles/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0f172a;
  --foreground: #f8fafc;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', sans-serif;
}

.gradient-text {
  background: linear-gradient(to right, #3b82f6, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}`,
    'src/App.tsx': `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/index';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;`,
    'package.json': `{
  "name": "ims-ec-marketing",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.16.0",
    "tailwindcss": "^3.4.0"
  }
}`
}

// File tree structure
const fileTree = [
    {
        name: 'IMS-EC-Marketing',
        type: 'folder',
        expanded: true,
        children: [
            { name: '.vscode', type: 'folder', children: [] },
            { name: 'public', type: 'folder', children: [] },
            {
                name: 'src',
                type: 'folder',
                expanded: true,
                children: [
                    {
                        name: 'components',
                        type: 'folder',
                        expanded: true,
                        children: [
                            { name: 'Hero.tsx', type: 'file', path: 'src/components/Hero.tsx' },
                            { name: 'Navbar.tsx', type: 'file', path: 'src/components/Navbar.tsx' },
                            { name: 'Features.tsx', type: 'file', path: 'src/components/Features.tsx' },
                        ]
                    },
                    {
                        name: 'pages', type: 'folder', children: [
                            { name: 'index.tsx', type: 'file', path: 'src/pages/index.tsx' }
                        ]
                    },
                    {
                        name: 'styles', type: 'folder', children: [
                            { name: 'globals.css', type: 'file', path: 'src/styles/globals.css' }
                        ]
                    },
                ]
            },
            { name: 'App.tsx', type: 'file', path: 'src/App.tsx' },
            { name: 'package.json', type: 'file', path: 'package.json' },
        ]
    }
]

// Syntax highlighting helper - simple token-based approach
function highlightCode(code, filename) {
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

export default function Workspace() {
    const [files, setFiles] = useState(initialFiles)
    const [activeFile, setActiveFile] = useState('src/components/Hero.tsx')
    const [openTabs, setOpenTabs] = useState(['src/components/Hero.tsx', 'src/styles/globals.css', 'src/App.tsx'])
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [messages, setMessages] = useState([
        { role: 'user', text: 'I want to create a marketing website for my college IMS Engineering College.' },
        { role: 'ai', text: "Understood. I'm generating a modern landing page structure using React and Tailwind CSS.", tags: ['Hero Section', 'Navbar'] }
    ])
    const [projectName] = useState('IMS-EC-Marketing-v1')
    const [cursorPosition] = useState({ line: 18, col: 92 })
    const recognitionRef = useRef(null)

    // Open file handler
    const openFile = (path) => {
        if (files[path]) {
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
        }
    }

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (typeof window === 'undefined') return

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) return

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

    // Handle confirm
    const handleConfirm = () => {
        if (transcript.trim()) {
            setMessages(prev => [...prev, { role: 'user', text: transcript }])
            setTranscript('')

            // Simulate AI response
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    text: "I'll add that feature to your project. Generating the code now...",
                    tags: ['Component']
                }])
            }, 1000)
        }
    }

    // Render file tree recursively
    const renderFileTree = (items, depth = 0) => {
        return items.map((item, idx) => (
            <div key={idx}>
                <div
                    className={`flex items-center gap-2 py-1 px-2 hover:bg-white/5 cursor-pointer text-sm ${item.type === 'file' && activeFile === item.path ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
                        }`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => item.type === 'file' && openFile(item.path)}
                >
                    {item.type === 'folder' ? (
                        <>
                            {item.expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                            {item.expanded ? <FolderOpen className="w-4 h-4 text-yellow-500" /> : <Folder className="w-4 h-4 text-yellow-500" />}
                        </>
                    ) : (
                        <>
                            <span className="w-4" />
                            <FileCode className="w-4 h-4 text-blue-400" />
                        </>
                    )}
                    <span>{item.name}</span>
                </div>
                {item.type === 'folder' && item.expanded && item.children && (
                    renderFileTree(item.children, depth + 1)
                )}
            </div>
        ))
    }

    const currentCode = files[activeFile] || ''
    const highlightedCode = highlightCode(currentCode, activeFile)
    const fileName = activeFile.split('/').pop()
    const breadcrumb = activeFile.split('/')

    return (
        <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden">
            {/* Top Header Bar */}
            <header className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    {/* Logo and Project */}
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <span className="font-semibold text-white text-sm">AI Workspace</span>
                    </div>

                    {/* Branch/Project Name */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-gray-500">main</span>
                        <span className="text-gray-600">•</span>
                        <span>{projectName}</span>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex items-center gap-1 ml-4">
                        {['File', 'Edit', 'View', 'Go', 'Run', 'Terminal'].map(item => (
                            <button key={item} className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded">
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                        <Rocket className="w-3.5 h-3.5" />
                        Deploy
                    </button>
                    <button className="flex items-center gap-2 bg-[#21262d] text-white text-xs font-medium px-4 py-1.5 rounded-lg border border-[#30363d] hover:bg-[#30363d] transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center cursor-pointer">
                        <span className="text-white text-xs font-bold">P</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - File Explorer */}
                <aside className="w-56 bg-[#0d1117] border-r border-[#30363d] flex flex-col flex-shrink-0">
                    {/* Explorer Header */}
                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explorer</span>
                        <button className="text-gray-500 hover:text-white">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* File Tree */}
                    <div className="flex-1 overflow-y-auto">
                        {renderFileTree(fileTree)}
                    </div>

                    {/* Settings */}
                    <div className="p-3 border-t border-[#30363d]">
                        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full px-2 py-1.5 hover:bg-white/5 rounded">
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

                    {/* Breadcrumb */}
                    <div className="px-4 py-2 bg-[#0d1117] border-b border-[#30363d]">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            {breadcrumb.map((part, idx) => (
                                <span key={idx} className="flex items-center gap-2">
                                    {idx > 0 && <ChevronRight className="w-3 h-3" />}
                                    <span className={idx === breadcrumb.length - 1 ? 'text-gray-300' : ''}>{part}</span>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Code Area */}
                    <div className="flex-1 overflow-auto font-mono text-sm">
                        <div className="min-w-max">
                            {highlightedCode.map(line => (
                                <div key={line.num} className="flex hover:bg-white/5">
                                    <span className="w-12 text-right pr-4 text-gray-600 select-none flex-shrink-0 py-0.5">
                                        {line.num}
                                    </span>
                                    <pre
                                        className="flex-1 text-gray-300 py-0.5"
                                        dangerouslySetInnerHTML={{ __html: line.content || '&nbsp;' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="h-6 bg-[#0d419d] flex items-center justify-between px-4 text-xs text-white flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full" />
                                0
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="text-yellow-400">△</span>
                                0
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
                            <span>UTF-8</span>
                            <span>TypeScript React</span>
                            <span>Prettier</span>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar - AI Assistant */}
                <aside className="w-80 bg-[#0d1117] border-l border-[#30363d] flex flex-col flex-shrink-0">
                    {/* AI Header */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-[#30363d]">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="font-medium text-white text-sm">AI Assistant</span>
                        </div>
                        <button className="text-gray-500 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Voice Input Section */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        {/* Microphone Button */}
                        <button
                            onClick={toggleListening}
                            className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all ${isListening
                                ? 'bg-blue-600 shadow-lg shadow-blue-600/30'
                                : 'bg-[#21262d] hover:bg-[#30363d]'
                                }`}
                        >
                            {isListening ? (
                                <Mic className="w-10 h-10 text-white" />
                            ) : (
                                <MicOff className="w-10 h-10 text-gray-400" />
                            )}
                        </button>

                        {/* Status Text */}
                        <span className={`text-sm font-medium ${isListening ? 'text-blue-400' : 'text-gray-500'}`}>
                            {isListening ? 'LISTENING...' : 'Click to speak'}
                        </span>

                        {/* Voice Waves Animation */}
                        {isListening && (
                            <div className="flex items-end gap-1 mt-4 h-8">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 bg-blue-500 rounded-full animate-pulse"
                                        style={{
                                            height: `${Math.random() * 24 + 8}px`,
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Transcript */}
                        {transcript && (
                            <div className="mt-6 p-4 bg-[#21262d] rounded-xl w-full">
                                <p className="text-gray-300 text-sm">{transcript}</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                                    {/* Avatar & Label */}
                                    <div className={`flex items-center gap-2 mb-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'user' ? (
                                            <>
                                                <span className="text-xs text-gray-500">You</span>
                                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                                    <span className="text-white text-[10px]">👤</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <span className="text-white text-[10px]">🤖</span>
                                                </div>
                                                <span className="text-xs text-gray-500">AI Agent</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-[#21262d] text-gray-300'
                                        }`}>
                                        <p className="text-sm">{msg.text}</p>
                                        {msg.tags && (
                                            <div className="flex gap-2 mt-2">
                                                {msg.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
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

                    {/* Action Buttons */}
                    <div className="p-4 border-t border-[#30363d] flex gap-3">
                        <button
                            onClick={() => setIsListening(false)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                        >
                            <MicOff className="w-4 h-4" />
                            Mute
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
                        >
                            <span>✓</span>
                            Confirm
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    )
}
