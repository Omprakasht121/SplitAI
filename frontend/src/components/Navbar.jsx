"use client"

import Link from 'next/link'

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                        <span className="text-xl leading-none">⚡</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Split AI</span>
                </Link>

                {/* Links */}
                <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
                    <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                    <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
                    <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors">
                        Login
                    </Link>
                    <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    )
}
