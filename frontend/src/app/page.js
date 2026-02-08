import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import CodeShowcase from '@/components/CodeShowcase'
import PricingCTA from '@/components/PricingCTA'
import Footer from '@/components/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <Navbar />
      <Hero />
      <Features />
      <CodeShowcase />
      <PricingCTA />
      <Footer />
    </div>
  )
}
