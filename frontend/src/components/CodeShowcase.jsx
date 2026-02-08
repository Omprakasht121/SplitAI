"use client"

import { Check, ArrowRight } from 'lucide-react'

export default function CodeShowcase() {
    return (
        <section className="py-24 bg-[#0B0E14] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Code that feels like <br />
                            <span className="text-blue-500">magic.</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Watch the AI interpret your voice commands and write complex logic. It handles responsive design, accessibility, and modern UI patterns automatically.
                        </p>

                        <div className="space-y-4 mb-8">
                            {[
                                "Tailwind CSS v3 Support",
                                "React & Vue Component Export",
                                "One-click Vercel Deployment"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-green-500" />
                                    </div>
                                    <span className="text-gray-300">{item}</span>
                                </div>
                            ))}
                        </div>

                        <a href="#" className="text-blue-500 font-semibold hover:text-blue-400 flex items-center gap-2 group">
                            Explore all features
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>

                    {/* Code Editor Visual */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 blur-lg" />
                        <div className="relative bg-[#13161C] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                            {/* Editor Header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#1A1D24]">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                                <div className="ml-4 text-xs text-gray-500 font-mono">App.jsx</div>
                            </div>

                            {/* Editor Content */}
                            <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                                <div className="space-y-1">
                                    <div className="text-purple-400">import <span className="text-yellow-200">React</span> from <span className="text-green-300">'react'</span>;</div>
                                    <div className="text-transparent">.</div>
                                    <div className="text-purple-400">export default <span className="text-blue-400">function</span> <span className="text-yellow-200">Hero</span>() {'{'}</div>
                                    <div className="text-purple-400 pl-4">return (</div>
                                    <div className="pl-8 text-gray-300">
                                        &lt;<span className="text-red-400">div</span> <span className="text-orange-300">className</span>=<span className="text-green-300">"bg-slate-900 min-h-screen flex items-center"</span>&gt;
                                    </div>
                                    <div className="pl-12 text-gray-300">
                                        &lt;<span className="text-red-400">h1</span> <span className="text-orange-300">className</span>=<span className="text-green-300">"text-6xl font-bold text-white"</span>&gt;
                                    </div>
                                    <div className="pl-16 text-white">
                                        Built with <br />
                                        &lt;<span className="text-red-400">span</span> <span className="text-orange-300">className</span>=<span className="text-green-300">"text-blue-500"</span>&gt;Voice&lt;/<span className="text-red-400">span</span>&gt;
                                    </div>
                                    <div className="pl-12 text-gray-300">
                                        &lt;/<span className="text-red-400">h1</span>&gt;
                                    </div>
                                    <div className="pl-8 text-gray-300">
                                        &lt;/<span className="text-red-400">div</span>&gt;
                                    </div>
                                    <div className="text-purple-400 pl-4">);</div>
                                    <div className="text-purple-400">{'}'}</div>

                                    <div className="flex items-center gap-2 text-blue-400 mt-4 animate-pulse">
                                        <span className="w-0.5 h-4 bg-blue-500" />
                                        <span>AI Generating...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
