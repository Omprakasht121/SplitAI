"""
MVP Generator Module
Generates static website code based on voice transcript
Uses STUBBED logic for MVP - always generates index.html and style.css
"""


import asyncio
import json
import os
from pathlib import Path
from typing import AsyncGenerator, Dict, Any, Optional

import sys
# Ensure backend directory is in path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from ai.llm_client import LLMClient
    from ai.prompts import Prompts
except ImportError as e:
    print(f"Import Error: {e}")
    # Fallback/Retry logic
    try:
        from backend.ai.llm_client import LLMClient
        from backend.ai.prompts import Prompts
    except ImportError:
         # Relative import fallback
        from ..ai.llm_client import LLMClient
        from ..ai.prompts import Prompts



import logging
import os

# Configure logging
log_path = Path(__file__).parent.parent / "debug.log"
logging.basicConfig(filename=str(log_path), level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class MVPGenerator:
    """
    MVP Website Generator
    Parses voice transcript and generates appropriate website code
    """
    
    
    def __init__(self):
        logging.info("Initializing MVPGenerator")
        self.templates = self._load_templates()
        try:
            self.llm_client = LLMClient()
            self.use_llm = True
            logging.info("LLMClient initialized successfully")
        except Exception as e:
            print(f"Warning: LLM Client initialization failed: {e}")
            logging.error(f"LLM Client initialization failed: {e}")
            self.use_llm = False

    
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
    
    async def generate(self, transcript: str, output_dir: Path, image_base64: Optional[str] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generate website files based on transcript
        Yields events for SSE streaming
        """
        # Detect website type for fallback/status
        website_type = self._detect_website_type(transcript)
        context = self._extract_context(transcript)
        
        yield {
            "type": "status",
            "message": f"Planning {website_type} website..."
        }
        await asyncio.sleep(0.3)
        
        html_content = ""
        css_content = ""
        
        # Try LLM Generation natively via token streams
        if self.use_llm:
            try:
                yield {"type": "status", "message": "Consulting AI architect..."}
                prompt = Prompts.generate_website_prompt(transcript)
                has_yielded = False
                async for event in self._stream_delimited_files(prompt, output_dir, temperature=1.0, image_base64=image_base64):
                    if event["type"] in ["file_start", "code_chunk", "file_complete"]:
                        has_yielded = True
                    yield event
                
                if has_yielded:
                    yield {"type": "status", "message": "Generation complete!"}
                    return
            except Exception as e:
                print(f"LLM Generation stream failed: {e}")
                # Fallback to templates will happen below
                yield {"type": "status", "message": "AI stream failed, using templates..."}
        
        # Fallback to Templates if LLM failed or disabled
        if not html_content or not css_content:
            template = self.templates.get(website_type, self.templates["default"])
            html_content = template["html"].format(**context)
            css_content = template["css"]
        
        # Generate index.html
        yield {"type": "status", "message": "Generating HTML structure..."}
        await asyncio.sleep(0.2)
        
        yield {"type": "file_start", "filename": "index.html"}
        
        # Stream HTML line by line
        for i, line in enumerate(html_content.split('\n')):
            yield {
                "type": "code_chunk",
                "filename": "index.html",
                "content": line + '\n'
            }
            if i % 10 == 0: await asyncio.sleep(0)
        
        # Save file to disk
        (output_dir / "index.html").write_text(html_content, encoding="utf-8")
        yield {"type": "file_complete", "filename": "index.html"}
        
        # Generate style.css
        yield {"type": "status", "message": "Generating styles..."}
        await asyncio.sleep(0.2)
        
        yield {"type": "file_start", "filename": "style.css"}
        
        # Stream CSS line by line
        for i, line in enumerate(css_content.split('\n')):
            yield {
                "type": "code_chunk",
                "filename": "style.css",
                "content": line + '\n'
            }
            if i % 10 == 0: await asyncio.sleep(0)
        
        # Save file to disk
        (output_dir / "style.css").write_text(css_content, encoding="utf-8")
        yield {"type": "file_complete", "filename": "style.css"}
        
        yield {"type": "status", "message": "Generation complete!"}

    async def _stream_delimited_files(self, prompt: str, output_dir: Path, temperature: float = 1.0, image_base64: Optional[str] = None) -> AsyncGenerator[Dict[str, Any], None]:
        import re
        file_marker_pattern = re.compile(r'---FILE:\s*([a-zA-Z0-9_\-\.]+)\s*---')
        
        current_file = None
        current_file_content = ""
        buffer = ""
        
        stream = self.llm_client.stream_response(prompt, temperature=temperature, image_base64=image_base64)
        
        async for chunk in stream:
            buffer += chunk
            while '\n' in buffer:
                line, buffer = buffer.split('\n', 1)
                match = file_marker_pattern.search(line)
                if match:
                    if current_file:
                        file_path = output_dir / current_file
                        file_path.parent.mkdir(parents=True, exist_ok=True)
                        file_path.write_text(current_file_content, encoding="utf-8")
                        yield {"type": "file_complete", "filename": current_file}
                    current_file = match.group(1).strip()
                    current_file_content = ""
                    yield {"type": "status", "message": f"Generating {current_file}..."}
                    yield {"type": "file_start", "filename": current_file}
                    after_marker = line[match.end():]
                    if after_marker.strip():
                        current_file_content += after_marker + "\n"
                        yield {"type": "code_chunk", "filename": current_file, "content": after_marker + "\n"}
                else:
                    if current_file:
                        line_with_newline = line + "\n"
                        current_file_content += line_with_newline
                        yield {"type": "code_chunk", "filename": current_file, "content": line_with_newline}
                        
        if buffer and current_file:
            current_file_content += buffer
            yield {"type": "code_chunk", "filename": current_file, "content": buffer}
        if current_file:
            file_path = output_dir / current_file
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(current_file_content, encoding="utf-8")
            yield {"type": "file_complete", "filename": current_file}

    async def create_plan(self, transcript: str, image_base64: Optional[str] = None) -> Dict[str, Any]:
        """
        Stage 1: Create a plan based on transcript
        """
        # Detect website type for fallback
        website_type = self._detect_website_type(transcript)
        
        if self.use_llm:
            try:
                prompt = Prompts.generate_plan_prompt(transcript)
                response_text = await self.llm_client.generate_response(prompt, temperature=1.0, image_base64=image_base64)
                
                clean_response = response_text.replace("```json", "").replace("```", "").strip()
                plan = json.loads(clean_response)
                # Ensure plan has required fields
                if "tasks" not in plan: plan["tasks"] = ["Generate website"]
                if "files" not in plan: plan["files"] = []
                plan["original_request"] = transcript
                logging.info(f"Plan generated successfully: {plan}")
                return plan
            except Exception as e:
                print(f"Plan generation failed with primary model: {e}")
                logging.error(f"Plan generation failed: {e}")
                
                # RETRY ONCE with a different model if possible (handled by LLMClient, but we can force a re-attempt here if needed)
                # LLMClient already tries all models. If it failed here, ALL models failed.
                pass
        
        # Fallback Plan
        print("!! WARNING: Entering Layout Fallback Mode (Quota Exceeded) !!")
        return {
            "type": website_type,
            "fallback_mode": "true", # Marker for UI/Logic to know 
            "original_request": transcript,
            "tasks": [
                f"Create {website_type} website structure",
                "Implement responsive design",
                "Add content sections"
            ],
            "files": [
                {"name": "index.html", "description": "Main page"},
                {"name": "style.css", "description": "Styles"}
            ]
        }

    async def _stream_file_content(self, filename: str, description: str, plan: Dict[str, Any], image_base64: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Helper to stream content for a single file using LLM"""
        if self.use_llm:
            try:
                import re
                prompt = Prompts.generate_single_file_prompt(filename, description, plan)
                stream = self.llm_client.stream_response(prompt, temperature=0.7, image_base64=image_base64)
                
                buffer = ""
                file_marker_pattern = re.compile(r'[-]+?\s*file:\s*?[a-zA-Z0-9_\-\.]+\s*[-]+?', re.IGNORECASE)
                md_block_pattern = re.compile(r'^```[a-zA-Z]*\s*$')

                async for chunk in stream:
                    buffer += chunk
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        clean_line = line.strip()
                        # Skip if line is a file marker or exactly ``` or ```html etc
                        if file_marker_pattern.match(clean_line) or md_block_pattern.match(clean_line) or clean_line == "```":
                            continue
                        yield line + '\n'
                
                if buffer:
                    clean_buf = buffer.strip()
                    if not (file_marker_pattern.match(clean_buf) or md_block_pattern.match(clean_buf) or clean_buf == "```"):
                        yield buffer

            except Exception as e:
                logging.error(f"Failed to stream {filename}: {e}")

    async def execute_plan(self, plan: Dict[str, Any], output_dir: Path, image_base64: Optional[str] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stage 2: Execute the plan to generate code for ALL files
        Parallelized version
        """
        import time
        start_time = time.time()
        
        yield {"type": "status", "message": "Executing plan (Parallel Mode)..."}
        
        files_to_generate = plan.get("files", [])
        
        # Fallback if no files in plan
        if not files_to_generate:
            files_to_generate = [
                {"name": "index.html", "description": "Main page"},
                {"name": "style.css", "description": "Styles"}
            ]

        # Start stream logic
        yield {"type": "status", "message": f"Generating {len(files_to_generate)} files with live auto-streaming..."}
        
        file_stats = []
        for file_info in files_to_generate:
            filename = file_info.get("name")
            description = file_info.get("description", "No description")
            if not filename: continue
            
            t_start = time.time()
            yield {"type": "file_start", "filename": filename}
            
            file_content = ""
            async for chunk in self._stream_file_content(filename, description, plan, image_base64=image_base64):
                file_content += chunk
                yield {"type": "code_chunk", "filename": filename, "content": chunk}
            
            # Fallback to Templates if content is empty (and LLM failed or was disabled)
            if not file_content and (filename == "index.html" or filename == "style.css"):
                website_type = plan.get("type", "default")
                context = self._extract_context(plan.get("original_request", ""))
                template = self.templates.get(website_type, self.templates["default"])
                if filename == "index.html":
                    file_content = template["html"].format(**context)
                else:
                    file_content = template["css"]
                # fake stream the fallback
                for i, line in enumerate(file_content.split('\n')):
                    yield {"type": "code_chunk", "filename": filename, "content": line + '\n'}
                    if i % 10 == 0: await asyncio.sleep(0) 
            
            if not file_content:
                file_content = f"/* Content for {filename} could not be generated */"
                yield {"type": "code_chunk", "filename": filename, "content": file_content}
                
            # Make sure directory exists for this file
            file_path = output_dir / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            file_path.write_text(file_content, encoding="utf-8")
            yield {"type": "file_complete", "filename": filename}
            
            duration = time.time() - t_start
            file_stats.append(f"{filename}: {duration:.2f}s")
            
        total_duration = time.time() - start_time
        yield {"type": "status", "message": f"Plan executed successfully in {total_duration:.2f}s!"}
        
        # Log performance
        try:
            log_entry = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Total: {total_duration:.2f}s | Files: {len(files_to_generate)} | Details: {', '.join(file_stats)}\n"
            log_path = Path(__file__).resolve().parent.parent / "generation_performance.log"
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(log_entry)
        except Exception as e:
            print(f"Failed to log performance: {e}")

    async def edit_project(self, current_files: Dict[str, str], instruction: str, output_dir: Path, image_base64: Optional[str] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Edit existing project files based on user instruction
        Yields events for SSE streaming
        """
        yield {"type": "status", "message": "Analyzing request..."}
        
        html_content = current_files.get("index.html", "")
        css_content = current_files.get("style.css", "")
        
        # Try LLM Editing token by token
        if self.use_llm:
            try:
                yield {"type": "status", "message": "Applying changes linearly..."}
                prompt = Prompts.generate_edit_prompt(current_files, instruction)
                
                has_yielded = False
                async for event in self._stream_delimited_files(prompt, output_dir, temperature=0.7, image_base64=image_base64):
                    has_yielded = True
                    yield event
                    
                if not has_yielded:
                    raise ValueError("Stream generated no output")
                
            except Exception as e:
                print(f"Edit failed: {e}")
                logging.error(f"Edit failed: {e}")
                yield {"type": "error", "message": str(e)}

        yield {"type": "status", "message": "Update complete!"}
    
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
