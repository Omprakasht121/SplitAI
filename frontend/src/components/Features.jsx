"use client"

import { Mic, Code, Zap } from 'lucide-react'

const features = [
    {
        icon: <Mic className="w-6 h-6 text-blue-400" />,
        title: "Natural Language",
        description: "Simply speak your layout ideas naturally. \"Add a contact form below the map\" works just like you'd expect."
    },
    {
        icon: <Code className="w-6 h-6 text-purple-400" />,
        title: "Clean Code Expert",
        description: "We don't just build images. We generate semantic HTML, Tailwind CSS, and React components you can actually use."
    },
    {
        icon: <Zap className="w-6 h-6 text-pink-400" />,
        title: "Instant Preview",
        description: "Watch your site come to life in real-time as you speak. Iterate instantly by refining your commands."
    }
]

export default function Features() {
    return (
        <section id="features" className="py-24 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">From voice to deployment instantly</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Our advanced NLP engine understands context, nuance, and design principles.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="glass-card p-8 rounded-xl hover:bg-white/[0.03] transition-colors group">
                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
