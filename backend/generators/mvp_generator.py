"""
MVP Generator Module
Generates static website code based on voice transcript
Uses STUBBED logic for MVP - always generates index.html and style.css
"""

import asyncio
from pathlib import Path
from typing import AsyncGenerator, Dict, Any


class MVPGenerator:
    """
    MVP Website Generator
    Parses voice transcript and generates appropriate website code
    """
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, Dict[str, str]]:
        """Load website templates for different types"""
        return {
            "marketing": self._get_marketing_template(),
            "portfolio": self._get_portfolio_template(),
            "landing": self._get_landing_template(),
            "default": self._get_default_template(),
        }
    
    def _detect_website_type(self, transcript: str) -> str:
        """
        Detect the type of website from transcript
        Simple keyword matching for MVP
        """
        transcript_lower = transcript.lower()
        
        if any(word in transcript_lower for word in ["marketing", "business", "company", "college", "school", "university"]):
            return "marketing"
        elif any(word in transcript_lower for word in ["portfolio", "personal", "resume", "cv"]):
            return "portfolio"
        elif any(word in transcript_lower for word in ["landing", "product", "app", "startup"]):
            return "landing"
        else:
            return "default"
    
    def _extract_context(self, transcript: str) -> Dict[str, str]:
        """
        Extract context from transcript for personalization
        Returns placeholder values for MVP
        """
        # Simple extraction - in real implementation, this would use NLP
        words = transcript.split()
        
        # Try to find a subject/topic
        topic = "Your Amazing Website"
        if "for" in transcript.lower():
            idx = transcript.lower().find("for")
            topic = transcript[idx + 4:].strip().title()
            if len(topic) > 50:
                topic = topic[:50]
        
        return {
            "title": topic,
            "tagline": f"Welcome to {topic}",
            "description": f"Discover what makes {topic} special.",
        }
    
    async def generate(self, transcript: str, output_dir: Path) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generate website files based on transcript
        Yields events for SSE streaming
        """
        # Detect website type
        website_type = self._detect_website_type(transcript)
        context = self._extract_context(transcript)
        
        yield {
            "type": "status",
            "message": f"Planning {website_type} website..."
        }
        await asyncio.sleep(0.3)
        
        # Get template
        template = self.templates.get(website_type, self.templates["default"])
        
        # Generate index.html
        yield {"type": "status", "message": "Generating HTML structure..."}
        await asyncio.sleep(0.2)
        
        html_content = template["html"].format(**context)
        yield {"type": "file_start", "filename": "index.html"}
        
        # Stream HTML line by line
        for line in html_content.split('\n'):
            yield {
                "type": "code_chunk",
                "filename": "index.html",
                "content": line + '\n'
            }
            await asyncio.sleep(0.03)  # Typing effect delay
        
        # Save file to disk
        (output_dir / "index.html").write_text(html_content, encoding="utf-8")
        yield {"type": "file_complete", "filename": "index.html"}
        
        # Generate style.css
        yield {"type": "status", "message": "Generating styles..."}
        await asyncio.sleep(0.2)
        
        css_content = template["css"]
        yield {"type": "file_start", "filename": "style.css"}
        
        # Stream CSS line by line
        for line in css_content.split('\n'):
            yield {
                "type": "code_chunk",
                "filename": "style.css",
                "content": line + '\n'
            }
            await asyncio.sleep(0.02)
        
        # Save file to disk
        (output_dir / "style.css").write_text(css_content, encoding="utf-8")
        yield {"type": "file_complete", "filename": "style.css"}
        
        yield {"type": "status", "message": "Generation complete!"}
    
    def _get_marketing_template(self) -> Dict[str, str]:
        """Marketing website template"""
        return {
            "html": '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">{title}</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="hero-content">
                <h1>{tagline}</h1>
                <p>{description}</p>
                <a href="#contact" class="cta-button">Get Started</a>
            </div>
        </section>

        <section id="about" class="about">
            <h2>About Us</h2>
            <p>We are dedicated to providing excellent services and creating meaningful experiences for our community.</p>
        </section>

        <section id="services" class="services">
            <h2>Our Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <h3>Service One</h3>
                    <p>Description of our first amazing service.</p>
                </div>
                <div class="service-card">
                    <h3>Service Two</h3>
                    <p>Description of our second amazing service.</p>
                </div>
                <div class="service-card">
                    <h3>Service Three</h3>
                    <p>Description of our third amazing service.</p>
                </div>
            </div>
        </section>

        <section id="contact" class="contact">
            <h2>Contact Us</h2>
            <p>Get in touch with us for more information.</p>
            <div class="contact-info">
                <p>Email: info@example.com</p>
                <p>Phone: (123) 456-7890</p>
            </div>
        </section>
    </main>

    <footer class="footer">
        <p>&copy; 2024 {title}. All rights reserved.</p>
    </footer>
</body>
</html>''',
            "css": '''/* Marketing Website Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --secondary: #f59e0b;
    --dark: #1f2937;
    --light: #f3f4f6;
    --white: #ffffff;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: var(--dark);
}

/* Navigation */
.header {
    background: var(--white);
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 100;
}

.nav {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    text-decoration: none;
    color: var(--dark);
    font-weight: 500;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: var(--primary);
}

/* Hero Section */
.hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: var(--white);
    text-align: center;
    padding: 2rem;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero-content p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.cta-button {
    display: inline-block;
    padding: 1rem 2rem;
    background: var(--secondary);
    color: var(--white);
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    transition: transform 0.3s, box-shadow 0.3s;
}

.cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

/* Sections */
section {
    padding: 5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

section h2 {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 2rem;
    color: var(--primary);
}

.about {
    background: var(--light);
    text-align: center;
    max-width: 100%;
}

.about p {
    max-width: 800px;
    margin: 0 auto;
    font-size: 1.1rem;
}

/* Services */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.service-card {
    background: var(--white);
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    text-align: center;
    transition: transform 0.3s;
}

.service-card:hover {
    transform: translateY(-10px);
}

.service-card h3 {
    color: var(--primary);
    margin-bottom: 1rem;
}

/* Contact */
.contact {
    text-align: center;
    background: var(--light);
    max-width: 100%;
}

.contact-info {
    margin-top: 2rem;
}

/* Footer */
.footer {
    background: var(--dark);
    color: var(--white);
    text-align: center;
    padding: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
    .nav {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-links {
        gap: 1rem;
    }
    
    .hero-content h1 {
        font-size: 2rem;
    }
}'''
        }
    
    def _get_portfolio_template(self) -> Dict[str, str]:
        """Portfolio website template"""
        return {
            "html": '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">{title}</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#work">Work</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <h1>{tagline}</h1>
            <p>{description}</p>
        </section>

        <section id="work" class="work">
            <h2>My Work</h2>
            <div class="work-grid">
                <div class="work-item">Project 1</div>
                <div class="work-item">Project 2</div>
                <div class="work-item">Project 3</div>
                <div class="work-item">Project 4</div>
            </div>
        </section>

        <section id="about" class="about">
            <h2>About Me</h2>
            <p>A passionate creator dedicated to building beautiful and functional experiences.</p>
        </section>

        <section id="contact" class="contact">
            <h2>Get In Touch</h2>
            <p>Feel free to reach out for collaborations or just a friendly hello!</p>
        </section>
    </main>

    <footer class="footer">
        <p>&copy; 2024 {title}</p>
    </footer>
</body>
</html>''',
            "css": '''/* Portfolio Website Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary: #8b5cf6;
    --dark: #0f172a;
    --light: #f8fafc;
    --gray: #64748b;
}

body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: var(--dark);
    color: var(--light);
}

.header {
    position: fixed;
    width: 100%;
    padding: 1.5rem 2rem;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(10px);
    z-index: 100;
}

.nav {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    color: var(--gray);
    text-decoration: none;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: var(--primary);
}

.hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
}

.hero h1 {
    font-size: 4rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--primary), #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero p {
    font-size: 1.25rem;
    color: var(--gray);
}

section {
    padding: 5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

section h2 {
    font-size: 2rem;
    margin-bottom: 2rem;
    color: var(--primary);
}

.work-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
}

.work-item {
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, #1e293b, #334155);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    transition: transform 0.3s;
}

.work-item:hover {
    transform: scale(1.02);
}

.about, .contact {
    text-align: center;
}

.about p, .contact p {
    color: var(--gray);
    max-width: 600px;
    margin: 0 auto;
}

.footer {
    text-align: center;
    padding: 2rem;
    color: var(--gray);
    border-top: 1px solid #1e293b;
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2.5rem;
    }
    
    .work-grid {
        grid-template-columns: 1fr;
    }
}'''
        }
    
    def _get_landing_template(self) -> Dict[str, str]:
        """Landing page template"""
        return {
            "html": '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="header">
        <div class="logo">{title}</div>
        <a href="#signup" class="nav-cta">Get Started</a>
    </header>

    <main>
        <section class="hero">
            <h1>{tagline}</h1>
            <p>{description}</p>
            <div class="hero-buttons">
                <a href="#signup" class="btn btn-primary">Start Free Trial</a>
                <a href="#features" class="btn btn-secondary">Learn More</a>
            </div>
        </section>

        <section id="features" class="features">
            <h2>Why Choose Us</h2>
            <div class="features-grid">
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <h3>Lightning Fast</h3>
                    <p>Experience blazing fast performance.</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🔒</div>
                    <h3>Secure</h3>
                    <p>Your data is always protected.</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🎨</div>
                    <h3>Beautiful</h3>
                    <p>Stunning design out of the box.</p>
                </div>
            </div>
        </section>

        <section id="signup" class="signup">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of happy users today.</p>
            <a href="#" class="btn btn-primary btn-large">Sign Up Now</a>
        </section>
    </main>

    <footer class="footer">
        <p>&copy; 2024 {title}. All rights reserved.</p>
    </footer>
</body>
</html>''',
            "css": '''/* Landing Page Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary: #10b981;
    --primary-dark: #059669;
    --dark: #111827;
    --light: #f9fafb;
    --gray: #6b7280;
}

body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: var(--dark);
    color: var(--light);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 3rem;
    position: fixed;
    width: 100%;
    background: rgba(17, 24, 39, 0.95);
    backdrop-filter: blur(10px);
    z-index: 100;
}

.logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
}

.nav-cta {
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: background 0.3s;
}

.nav-cta:hover {
    background: var(--primary-dark);
}

.hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
    background: radial-gradient(ellipse at center, #1f2937 0%, var(--dark) 100%);
}

.hero h1 {
    font-size: 3.5rem;
    margin-bottom: 1.5rem;
    max-width: 800px;
}

.hero p {
    font-size: 1.25rem;
    color: var(--gray);
    margin-bottom: 2rem;
    max-width: 600px;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
}

.btn {
    padding: 1rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: transform 0.3s, box-shadow 0.3s;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-secondary {
    background: transparent;
    color: var(--light);
    border: 2px solid var(--gray);
}

.btn:hover {
    transform: translateY(-2px);
}

.btn-large {
    padding: 1.25rem 3rem;
    font-size: 1.1rem;
}

section {
    padding: 5rem 2rem;
}

section h2 {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 1rem;
}

.features {
    max-width: 1200px;
    margin: 0 auto;
}

.features > p {
    text-align: center;
    color: var(--gray);
    margin-bottom: 3rem;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.feature {
    background: #1f2937;
    padding: 2rem;
    border-radius: 16px;
    text-align: center;
    transition: transform 0.3s;
}

.feature:hover {
    transform: translateY(-5px);
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.feature h3 {
    color: var(--primary);
    margin-bottom: 0.5rem;
}

.feature p {
    color: var(--gray);
}

.signup {
    text-align: center;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border-radius: 24px;
    max-width: 800px;
    margin: 2rem auto;
    padding: 4rem 2rem;
}

.signup h2 {
    color: white;
}

.signup p {
    color: rgba(255,255,255,0.9);
    margin-bottom: 2rem;
}

.signup .btn-primary {
    background: white;
    color: var(--primary-dark);
}

.footer {
    text-align: center;
    padding: 2rem;
    color: var(--gray);
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
    }
}'''
        }
    
    def _get_default_template(self) -> Dict[str, str]:
        """Default website template"""
        return {
            "html": '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="header">
        <h1 class="logo">{title}</h1>
    </header>

    <main class="main">
        <section class="hero">
            <h2>{tagline}</h2>
            <p>{description}</p>
        </section>

        <section class="content">
            <h3>Welcome</h3>
            <p>This is your new website. Customize it to make it your own!</p>
        </section>
    </main>

    <footer class="footer">
        <p>&copy; 2024 {title}</p>
    </footer>
</body>
</html>''',
            "css": '''/* Default Website Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    background: #f5f5f5;
    color: #333;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    text-align: center;
}

.logo {
    font-size: 2rem;
}

.main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
}

.hero {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 10px;
    margin-bottom: 2rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #667eea;
}

.hero p {
    font-size: 1.2rem;
    color: #666;
}

.content {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.content h3 {
    color: #667eea;
    margin-bottom: 1rem;
}

.footer {
    text-align: center;
    padding: 2rem;
    color: #666;
    margin-top: 2rem;
}'''
        }
