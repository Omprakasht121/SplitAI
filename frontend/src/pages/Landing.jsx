import { useNavigate } from 'react-router-dom'

/**
 * Landing Page Component
 * - Hero section with main value proposition
 * - "Get Started" button navigates to workspace
 */
function Landing() {
    const navigate = useNavigate()

    const handleGetStarted = () => {
        navigate('/workspace')
    }

    return (
        <div className="landing">
            {/* Header */}
            <header className="landing-header">
                <div className="logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">Split AI</span>
                </div>
            </header>

            {/* Hero Section */}
            <main className="landing-hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Build Websites
                        <span className="hero-highlight"> by Speaking</span>
                    </h1>
                    <p className="hero-subtitle">
                        Transform your ideas into real websites using just your voice.
                        No coding required. Just speak and watch your website come to life.
                    </p>
                    <button className="cta-button" onClick={handleGetStarted}>
                        <span className="mic-icon">🎤</span>
                        Get Started
                    </button>
                </div>

                {/* Decorative elements */}
                <div className="hero-visual">
                    <div className="floating-card">
                        <div className="code-preview">
                            <span className="code-line">&lt;html&gt;</span>
                            <span className="code-line">  &lt;body&gt;</span>
                            <span className="code-line">    &lt;h1&gt;Hello World&lt;/h1&gt;</span>
                            <span className="code-line">  &lt;/body&gt;</span>
                            <span className="code-line">&lt;/html&gt;</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="features">
                <div className="feature-card">
                    <div className="feature-icon">🎙️</div>
                    <h3>Voice First</h3>
                    <p>Simply speak your ideas and let AI do the heavy lifting</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>Instant Generation</h3>
                    <p>Watch your code appear in real-time as you speak</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🚀</div>
                    <h3>Live Preview</h3>
                    <p>See your website instantly with one-click preview</p>
                </div>
            </section>
        </div>
    )
}

export default Landing
