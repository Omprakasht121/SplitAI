"use client"

import Link from 'next/link'
import { Check } from 'lucide-react'

export default function PricingCTA() {
    return (
        <section id="pricing" className="py-24 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to amplify your workflow?</h2>
                <p className="text-gray-400 mb-12">
                    Join thousands of developers who are building faster with voice. Start for free, upgrade when you scale.
                </p>

                {/* Pricing Card */}
                <div className="max-w-md mx-auto bg-[#0F1119] border border-blue-500/30 rounded-2xl p-8 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600" />

                    <div className="text-blue-400 text-sm font-bold tracking-wider uppercase mb-2">Early Access</div>
                    <div className="flex items-baseline justify-center gap-1 mb-6">
                        <span className="text-5xl font-bold text-white">$0</span>
                        <span className="text-gray-400">/ month</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-8">Free during beta period</p>

                    <div className="space-y-4 mb-8 text-left">
                        {[
                            "Unlimited voice commands",
                            "React & HTML Export",
                            "Community Support",
                            "Access to all templates"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <Link href="/signup" className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-600/25">
                        Get Started Now
                    </Link>
                    <p className="text-xs text-center text-gray-500 mt-4">No credit card required.</p>
                </div>
            </div>
        </section>
    )
}
