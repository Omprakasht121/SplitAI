"use client"

import Link from 'next/link'
import { Mic, Play, Monitor, Code2, Zap, Cloud } from 'lucide-react'
import { useState } from 'react'

export default function Hero() {
    const [prompt, setPrompt] = useState('Create a landing page for a coffee shop')

    return (
        <div className="relative pt-32 pb-20 overflow-hidden">
            <div className="hero-glow" />

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    v2.0 NOW LIVE WITH REACT EXPORT
                </div>

                {/* Heading */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                    Build websites <br />
                    <span className="text-gradient">by speaking.</span>
                </h1>

                {/* Subheading */}
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                    Ditch the code editor. Describe your vision, and our AI constructs production-ready code in real-time. No syntax errors, just pure creation.
                </p>

                {/* Input Mockup */}
                <div className="max-w-2xl mx-auto mb-12 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-30 group-hover:opacity-50 blur transition duration-500" />
                    <div className="relative bg-[#13161C] rounded-full p-2 flex items-center shadow-2xl border border-white/10 input-glow-border">
                        <div className="pl-4 text-blue-500 pr-3 border-r border-white/10 h-6 flex items-center">
                            <span className="flex gap-1 items-center h-4">
                                <span className="w-0.5 h-2 bg-blue-500 rounded-full animate-[wave_1s_ease-in-out_infinite]" />
                                <span className="w-0.5 h-4 bg-blue-500 rounded-full animate-[wave_1s_ease-in-out_infinite_0.1s]" />
                                <span className="w-0.5 h-3 bg-blue-500 rounded-full animate-[wave_1s_ease-in-out_infinite_0.2s]" />
                                <span className="w-0.5 h-2 bg-blue-500 rounded-full animate-[wave_1s_ease-in-out_infinite_0.3s]" />
                            </span>
                        </div>
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-gray-300 px-4 placeholder-gray-600 font-mono text-sm"
                            placeholder="Describe your website..."
                        />
                        <button className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full transition-all hover:scale-105 shadow-lg shadow-blue-600/20">
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
                    <Link href="/signup" className="bg-white text-black hover:bg-gray-200 px-8 py-3.5 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                        Start Building Free
                        <span className="text-lg">→</span>
                    </Link>
                    <button className="px-8 py-3.5 rounded-lg font-semibold text-gray-300 border border-white/10 hover:bg-white/5 flex items-center gap-2 transition-colors">
                        <Play className="w-4 h-4 fill-current" />
                        Watch Demo
                    </button>
                </div>

                {/* Trusted By */}
                <div className="pt-12 border-t border-white/5">
                    <p className="text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase mb-8">Trusted by developers at</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 font-bold text-lg text-white"><Monitor className="w-5 h-5" /> ACME</div>
                        <div className="flex items-center gap-2 font-bold text-lg text-white"><Zap className="w-5 h-5" /> TechFlow</div>
                        <div className="flex items-center gap-2 font-bold text-lg text-white"><Code2 className="w-5 h-5" /> BlockStack</div>
                        <div className="flex items-center gap-2 font-bold text-lg text-white"><Cloud className="w-5 h-5" /> Nebula</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
