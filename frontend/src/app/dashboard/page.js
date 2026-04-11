/* eslint-disable @next/next/no-img-element */
"use client"

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Plus, Search, Mic, Paperclip, Pencil, ArrowRight, MoreVertical, Camera, Image as ImageIcon, X, Check, Loader2, Trash2, Edit3, Square, CheckSquare } from 'lucide-react'

const categories = [
    "Todo App",
    "E-commerce Store",
    "Blog Platform",
    "Chat Application"
]

function ProjectCard({ project, selectedProjects, toggleSelection, dropdownOpen, setDropdownOpen, startRename, handleDeleteProject }) {
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const cardRef = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !preview && !loading) {
                loadPreview()
            }
        }, { threshold: 0.1 })

        if (cardRef.current) {
            observer.observe(cardRef.current)
        }

        return () => observer.disconnect()
    }, [preview, loading])

    const loadPreview = async () => {
        setLoading(true)
        try {
            const { fetchProjectPreview } = await import('@/lib/api')
            const data = await fetchProjectPreview(project.id)
            setPreview(data)
        } catch (err) {
            console.error("Failed to load preview", err)
        } finally {
            setLoading(false)
        }
    }

    const isSelected = selectedProjects.includes(project.id)

    // Generate srcdoc for the preview iframe
    const getSrcDoc = () => {
        if (!preview || !preview.html) return ''
        let html = preview.html
        if (preview.css) {
            html = html.replace('</head>', `<style>${preview.css}</style></head>`)
            if (!html.includes('<style>')) html = `<style>${preview.css}</style>` + html
        }
        if (preview.js) {
            html = html.replace('</body>', `<script>${preview.js}</script></body>`)
        }
        return html
    }

    return (
        <div ref={cardRef} className="group relative">
            {/* Selection Checkbox */}
            <button 
                onClick={(e) => toggleSelection(e, project.id)}
                className={`absolute top-3 left-3 z-30 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isSelected 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-black/40 text-white/40 opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10'
                }`}
            >
                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>

            <Link href={`/workspace?project=${project.id}`} className="block">
                <div className={`bg-[#13161C] border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/20'
                }`}>
                    {/* Preview Header / Browser Frame */}
                    <div className="h-40 bg-[#0B0E14] relative overflow-hidden flex flex-col">
                        <div className="h-6 bg-[#1A1D24] border-b border-white/5 flex items-center px-3 gap-1.5 z-20">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            </div>
                            <div className="flex-1 max-w-[120px] h-3 bg-white/5 rounded-full mx-auto" />
                        </div>

                        <div className="flex-1 relative bg-gradient-to-br from-blue-500/10 to-purple-600/10">
                            {preview && preview.html ? (
                                <div className="absolute inset-0 origin-top-left pointer-events-none transition-opacity duration-500 ease-in-out" style={{ width: '400%', height: '400%', transform: 'scale(0.25)' }}>
                                    <iframe 
                                        srcDoc={getSrcDoc()}
                                        className="w-full h-full border-none pointer-events-none"
                                        title={`Preview ${project.name}`}
                                    />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 text-blue-500/50 animate-spin" />
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2">
                                                <ImageIcon className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">No Preview</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Glassmorphism Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#13161C] via-transparent to-transparent opacity-60" />
                        </div>

                        {/* Dropdown Menu Toggle */}
                        <button 
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setDropdownOpen(dropdownOpen === project.id ? null : project.id)
                            }}
                            className={`absolute top-8 right-3 z-30 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-lg transition-opacity ${dropdownOpen === project.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                            <MoreVertical className="w-4 h-4 text-white" />
                        </button>

                        {/* Dropdown Content */}
                        {dropdownOpen === project.id && (
                            <div className="absolute top-16 right-3 z-40 w-32 bg-[#1C2129] border border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100">
                                <button 
                                    onClick={(e) => startRename(e, project)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" /> Rename
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="p-4 flex items-center gap-3 bg-[#13161C]">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/10 transition-transform group-hover:scale-110">
                            {project.first_letter}
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-semibold text-white text-sm truncate">{project.name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">Updated {new Date(project.updated_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

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

    const [user, setUser] = useState(null)
    const [projects, setProjects] = useState([])
    const [loadingProjects, setLoadingProjects] = useState(true)
    
    // Management states
    const [selectedProjects, setSelectedProjects] = useState([])
    const [dropdownOpen, setDropdownOpen] = useState(null) // ID of project with open dropdown
    const [isDeleting, setIsDeleting] = useState(false)
    const [editingProject, setEditingProject] = useState(null) // { id, name }

    // New Project states
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [newProjectDescription, setNewProjectDescription] = useState('')
    const [creatingProject, setCreatingProject] = useState(false)

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

            try {
                const { fetchProjects } = await import('@/lib/api')
                const data = await fetchProjects()
                setProjects(data)
            } catch (err) {
                console.error("Failed to load projects", err)
            } finally {
                setLoadingProjects(false)
            }
        }
        loadInitialData()
        
        // Close dropdown on click outside
        const handleClickOutside = () => setDropdownOpen(null)
        window.addEventListener('click', handleClickOutside)
        return () => window.removeEventListener('click', handleClickOutside)
    }, [])

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

    const handleCategoryClick = async (category) => {
        setIsCreating(true)
        try {
            if (uploadedImagePreview) {
                localStorage.setItem('pending_design_image', uploadedImagePreview)
            }
            
            const { createProject } = await import('@/lib/api')
            const project = await createProject(`A ${category}`, 'marketing', `Build a ${category}`, uploadedImagePreview)
            window.location.href = `/workspace?project=${project.id}&prompt=${encodeURIComponent(`Build a ${category}`)}`
        } catch (e) {
            console.error(e)
            setIsCreating(false)
        }
    }

    const handleCreateProject = async () => {
        if (prompt.trim()) {
            setIsCreating(true)
            try {
                if (uploadedImagePreview) {
                    localStorage.setItem('pending_design_image', uploadedImagePreview)
                }

                const { createProject } = await import('@/lib/api')
                const project = await createProject(prompt, 'default', prompt, uploadedImagePreview)
                window.location.href = `/workspace?project=${project.id}&prompt=${encodeURIComponent(prompt)}`
            } catch (e) {
                console.error(e)
                setIsCreating(false)
            }
        }
    }

    // New Project Modal logic
    const handleOpenNewProjectModal = (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        setNewProjectName('')
        setNewProjectDescription('')
        setIsNewProjectModalOpen(true)
    }

    const handleConfirmNewProject = async (e) => {
        if (e) e.preventDefault()
        if (!newProjectName.trim()) return
        
        setCreatingProject(true)
        try {
            const { createProject } = await import('@/lib/api')
            // Pass description to the description field, and keep prompt null
            const project = await createProject(newProjectName, 'default', null, null, newProjectDescription)
            // Redirect without prompt URL param to prevent auto-generation
            window.location.href = `/workspace?project=${project.id}`
        } catch (err) {
            console.error(err)
            alert('Failed to create project')
            setCreatingProject(false)
        }
    }

    // Project Management Handlers
    const toggleSelection = (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedProjects(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    const handleDeleteProject = async (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this project?')) return
        
        try {
            const { deleteProject } = await import('@/lib/api')
            await deleteProject(id)
            setProjects(prev => prev.filter(p => p.id !== id))
            setSelectedProjects(prev => prev.filter(p => p !== id))
        } catch (err) {
            alert('Failed to delete project')
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedProjects.length} projects?`)) return
        setIsDeleting(true)
        try {
            const { bulkDeleteProjects } = await import('@/lib/api')
            await bulkDeleteProjects(selectedProjects)
            setProjects(prev => prev.filter(p => !selectedProjects.includes(p.id)))
            setSelectedProjects([])
        } catch (err) {
            alert('Failed to delete projects')
        } finally {
            setIsDeleting(false)
        }
    }

    const startRename = (e, project) => {
        e.preventDefault()
        e.stopPropagation()
        setEditingProject({ id: project.id, name: project.name })
        setDropdownOpen(null)
    }

    const submitRename = async (e) => {
        e.preventDefault()
        if (!editingProject.name.trim()) return
        
        try {
            const { updateProject } = await import('@/lib/api')
            await updateProject(editingProject.id, { name: editingProject.name })
            setProjects(prev => prev.map(p => 
                p.id === editingProject.id ? { ...p, name: editingProject.name } : p
            ))
            setEditingProject(null)
        } catch (err) {
            alert('Failed to rename project')
        }
    }

    const resetState = () => {
        setMessages([])
        setShowSuccess(false)
        setCreatedProject(null)
        setIsCreating(false)
    }

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#0B0E14]">
            {/* Bulk Action Bar */}
            {selectedProjects.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
                    <span className="font-semibold">{selectedProjects.length} projects selected</span>
                    <div className="w-px h-6 bg-white/20" />
                    <button 
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete All
                    </button>
                    <button 
                        onClick={() => setSelectedProjects([])}
                        className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                </div>
            )}

            {/* New Project Modal */}
            {isNewProjectModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#13161C] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Create New Project</h3>
                            <button onClick={() => setIsNewProjectModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Project Name <span className="text-red-500">*</span></label>
                                <input 
                                    autoFocus
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Enter project name..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Description (Optional)</label>
                                <textarea 
                                    value={newProjectDescription}
                                    onChange={(e) => setNewProjectDescription(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
                                    placeholder="What are you building?"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button 
                                onClick={() => setIsNewProjectModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmNewProject}
                                disabled={!newProjectName.trim() || creatingProject}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-600 text-white px-6 py-2 rounded-xl transition-all flex items-center gap-2"
                            >
                                {creatingProject && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal Overlay */}
            {editingProject && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#13161C] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Rename Project</h3>
                        <input 
                            autoFocus
                            type="text"
                            value={editingProject.name}
                            onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && submitRename(e)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-6"
                            placeholder="Project name"
                        />
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setEditingProject(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitRename}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-all"
                            >
                                Update Name
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="border-b border-white/5 bg-[#0B0E14]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                            <span className="text-lg">⚡</span>
                        </div>
                        <span className="font-bold text-lg text-white">Split AI</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Dashboard
                        </Link>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-lg shadow-pink-500/20">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative pt-16 pb-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-purple-600/5 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Build something <span className="text-gradient">Amazing</span>
                    </h1>
                    <p className="text-gray-400 text-lg mb-10">
                        Create apps and websites by chatting with AI
                    </p>

                    {/* AI Input */}
                    <div className="max-w-2xl mx-auto mb-8">
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
                                placeholder="Ask Split AI to create a..."
                            />

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
                </div>
            </div>

            {/* Projects Section */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Your Projects</h2>
                    <div className="flex items-center gap-4">
                        {projects.length > 0 && selectedProjects.length === 0 && (
                            <button 
                                onClick={() => setSelectedProjects(projects.map(p => p.id))}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Select All
                            </button>
                        )}
                        <Link href="#" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
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
                    <button onClick={handleOpenNewProjectModal} className="group text-left">
                        <div className="bg-[#13161C] border-2 border-dashed border-white/10 group-hover:border-blue-500/50 rounded-xl p-6 h-full min-h-[192px] flex flex-col items-center justify-center transition-all group-hover:bg-white/[0.02]">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-500/10 transition-colors">
                                <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-400" />
                            </div>
                            <span className="font-semibold text-white mb-1">New Project</span>
                            <span className="text-sm text-gray-500">Start creating</span>
                        </div>
                    </button>

                    {loadingProjects ? (
                        <div className="col-span-full py-12 flex justify-center text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (filteredProjects.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            {searchQuery ? 'No projects matching your search' : 'No projects found'}
                        </div>
                    ) : filteredProjects.map((project) => (
                        <ProjectCard 
                            key={project.id}
                            project={project}
                            selectedProjects={selectedProjects}
                            toggleSelection={toggleSelection}
                            dropdownOpen={dropdownOpen}
                            setDropdownOpen={setDropdownOpen}
                            startRename={startRename}
                            handleDeleteProject={handleDeleteProject}
                        />
                    )))}
                </div>
            </div>

            <button
                onClick={handleOpenNewProjectModal}
                className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all hover:scale-110 z-[50]"
            >
                <Plus className="w-6 h-6 text-white" />
            </button>
        </div>
    )
}
