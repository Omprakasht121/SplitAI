"use client"

import Link from 'next/link'
import { useState, useRef } from 'react'
import { Plus, Search, Mic, Paperclip, Pencil, ArrowRight, MoreVertical, Camera, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react'

const categories = [
    "Todo App",
    "E-commerce Store",
    "Blog Platform",
    "Chat Application"
]

const sampleProjects = [
    {
        id: 1,
        name: "AI Chat Assistant",
        editedAt: "2 hours ago",
        gradient: "from-blue-500 to-purple-600",
        initial: "A",
        initialColor: "bg-blue-500"
    },
    {
        id: 2,
        name: "E-commerce Dashboard",
        editedAt: "1 day ago",
        gradient: "from-green-400 to-cyan-500",
        initial: "E",
        initialColor: "bg-green-500"
    },
    {
        id: 3,
        name: "Task Manager Pro",
        editedAt: "3 days ago",
        gradient: "from-pink-500 to-orange-400",
        initial: "T",
        initialColor: "bg-pink-500"
    }
]

export default function Dashboard() {
    const [prompt, setPrompt] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [messages, setMessages] = useState([])
    const [isCreating, setIsCreating] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [createdProject, setCreatedProject] = useState(null)
    const [uploadedImage, setUploadedImage] = useState(null)
    const [uploadedImagePreview, setUploadedImagePreview] = useState(null)
    const fileInputRef = useRef(null)

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            setUploadedImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setUploadedImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setUploadedImage(null)
        setUploadedImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCategoryClick = (category) => {
        setPrompt('')

        // Add user message
        const userMessage = { type: 'user', text: category, isCategory: true }
        setMessages([userMessage])

        // Simulate AI response
        setTimeout(() => {
            const aiMessage = {
                type: 'ai',
                text: `Great! I'll help you create: "${category}". Setting up your project now...`
            }
            setMessages(prev => [...prev, aiMessage])
            setIsCreating(true)

            // Simulate project creation
            setTimeout(() => {
                setIsCreating(false)
                setShowSuccess(true)
                setCreatedProject(category)
            }, 2000)
        }, 500)
    }

    const handleCreateProject = () => {
        if (prompt.trim() || uploadedImage) {
            const userMessage = {
                type: 'user',
                text: prompt || 'Create from uploaded image',
                hasImage: !!uploadedImage,
                imagePreview: uploadedImagePreview
            }
            setMessages([userMessage])
            setPrompt('')

            setTimeout(() => {
                const aiMessage = {
                    type: 'ai',
                    text: `Great! I'll help you create: "${prompt || 'Custom Project'}". Setting up your project now...`
                }
                setMessages(prev => [...prev, aiMessage])
                setIsCreating(true)

                setTimeout(() => {
                    setIsCreating(false)
                    setShowSuccess(true)
                    setCreatedProject(prompt || 'Custom Project')
                    removeImage()
                }, 2000)
            }, 500)
        }
    }

    const resetState = () => {
        setMessages([])
        setShowSuccess(false)
        setCreatedProject(null)
        setIsCreating(false)
    }

    // Success Screen
    if (showSuccess) {
        return (
            <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

                <div className="text-center relative z-10 max-w-md mx-auto px-6">
                    {/* Success Icon */}
                    <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Check className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-3">
                        Project Created! 🎉
                    </h1>
                    <p className="text-gray-400 text-lg mb-12">
                        Your project is ready to start building
                    </p>

                    {/* Next Steps */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                        <h2 className="font-semibold text-white mb-6">Next Steps</h2>

                        <div className="space-y-4 text-left">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <div className="font-medium text-white">Customize Your Project</div>
                                    <div className="text-sm text-gray-500">Add features, components, and styling</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <div className="font-medium text-white">Test & Preview</div>
                                    <div className="text-sm text-gray-500">See your project in action</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <div className="font-medium text-white">Deploy</div>
                                    <div className="text-sm text-gray-500">Launch your project to the world</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/workspace"
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25"
                        >
                            Open Project
                        </Link>
                        <button
                            onClick={resetState}
                            className="bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-xl border border-white/10 transition-colors"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0B0E14]">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#0B0E14]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                            <span className="text-lg">⚡</span>
                        </div>
                        <span className="font-bold text-lg text-white">VoiceBuild AI</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Dashboard
                        </Link>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer">
                            U
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative pt-16 pb-12 overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-purple-600/5 to-transparent pointer-events-none" />

                {/* Active gradient when creating */}
                {messages.length > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-500/10 to-purple-500/10 pointer-events-none" />
                )}

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    {messages.length === 0 ? (
                        <>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                Build something <span className="text-gradient">Amazing</span>
                            </h1>
                            <p className="text-gray-400 text-lg mb-10">
                                Create apps and websites by chatting with AI
                            </p>
                        </>
                    ) : (
                        <div className="mb-8 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.type === 'user' ? (
                                        msg.isCategory ? (
                                            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2.5 rounded-full font-medium">
                                                {msg.text}
                                            </div>
                                        ) : (
                                            <div className="bg-white/10 text-white px-6 py-3 rounded-2xl max-w-md text-left">
                                                {msg.hasImage && msg.imagePreview && (
                                                    <img src={msg.imagePreview} alt="Uploaded" className="w-32 h-32 object-cover rounded-lg mb-2" />
                                                )}
                                                {msg.text}
                                            </div>
                                        )
                                    ) : (
                                        <div className="bg-white text-gray-700 px-6 py-3 rounded-2xl max-w-md text-left shadow-lg">
                                            {msg.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AI Input */}
                    <div className="max-w-2xl mx-auto mb-8">
                        {/* Uploaded Image Preview */}
                        {uploadedImagePreview && (
                            <div className="mb-4 inline-block relative">
                                <img
                                    src={uploadedImagePreview}
                                    alt="Upload preview"
                                    className="w-24 h-24 object-cover rounded-xl border-2 border-white/20"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-2xl p-2 flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                                className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm"
                                placeholder="Ask VoiceBuild AI to create a..."
                            />

                            {/* Image/Gallery Upload Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                            </button>

                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Pencil className="w-5 h-5" />
                            </button>

                            {isCreating ? (
                                <div className="p-2 bg-blue-600 text-white rounded-lg">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            ) : (
                                <button
                                    onClick={handleCreateProject}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Pills */}
                    {messages.length === 0 && (
                        <div className="flex flex-wrap justify-center gap-3">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 transition-colors"
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Projects Section */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Your Projects</h2>
                    <Link href="#" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                        View all <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#13161C] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Search projects..."
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="bg-[#13161C] border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                            <option>Last edited</option>
                            <option>Newest first</option>
                            <option>Oldest first</option>
                        </select>
                        <select className="bg-[#13161C] border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                            <option>All creators</option>
                            <option>Created by me</option>
                        </select>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* New Project Card */}
                    <Link href="/workspace" className="group">
                        <div className="bg-[#13161C] border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-xl p-6 h-48 flex flex-col items-center justify-center transition-all hover:bg-white/[0.02]">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-500/10 transition-colors">
                                <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-400" />
                            </div>
                            <span className="font-semibold text-white mb-1">New Project</span>
                            <span className="text-sm text-gray-500">Start creating</span>
                        </div>
                    </Link>

                    {/* Existing Projects */}
                    {sampleProjects.map((project) => (
                        <Link href={`/workspace?project=${project.id}`} key={project.id} className="group">
                            <div className="bg-[#13161C] border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20 hover:shadow-lg">
                                {/* Gradient Preview */}
                                <div className={`h-32 bg-gradient-to-br ${project.gradient} relative`}>
                                    <button className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                                {/* Project Info */}
                                <div className="p-4 flex items-center gap-3">
                                    <div className={`w-8 h-8 ${project.initialColor} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                                        {project.initial}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">{project.name}</div>
                                        <div className="text-xs text-gray-500">Edited {project.editedAt}</div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Floating Action Button */}
            <Link
                href="/workspace"
                className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all hover:scale-110"
            >
                <Plus className="w-6 h-6 text-white" />
            </Link>
        </div>
    )
}
