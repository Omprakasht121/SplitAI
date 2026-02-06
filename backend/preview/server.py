"""
Preview Server Module
Serves generated static files for live preview
"""

import asyncio
import subprocess
import sys
from pathlib import Path
from typing import Optional


class PreviewServer:
    """
    Simple static file server for previewing generated websites
    """
    
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.port = 8080
    
    async def start(self, directory: Path) -> str:
        """
        Start the preview server serving files from the specified directory
        Returns the URL to access the preview
        """
        # Stop any existing server
        await self.stop()
        
        # Start Python's built-in HTTP server
        self.process = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(self.port)],
            cwd=str(directory),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        
        # Give the server a moment to start
        await asyncio.sleep(0.5)
        
        return f"http://localhost:{self.port}"
    
    async def stop(self):
        """Stop the preview server if running"""
        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.process = None
    
    def is_running(self) -> bool:
        """Check if the server is currently running"""
        return self.process is not None and self.process.poll() is None
