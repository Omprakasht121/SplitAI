
/**
 * Split AI API Client
 * Handles communication with the FastAPI backend
 */

const API_BASE_URL = 'http://127.0.0.1:8000'; // Bypass Next.js rewrites proxy to prevent SSE buffering

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return await response.json();
};

export const register = async (name, email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) throw new Error('Registration failed');
    return await response.json();
};

export const fetchProjects = async () => {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    return await response.json();
};

export const createProject = async (name, website_type = 'default', prompt = null, design_image = null, description = null) => {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, website_type, prompt, design_image, description }),
    });
    
    if (!response.ok) {
        let errorMessage = `API Error ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                    // Extract field names and messages from FastAPI validation errors
                    errorMessage = errorData.detail.map(err => {
                        const field = err.loc ? err.loc[err.loc.length - 1] : 'error';
                        return `${field}: ${err.msg}`;
                    }).join(', ');
                } else if (typeof errorData.detail === 'object') {
                    errorMessage = JSON.stringify(errorData.detail);
                } else {
                    errorMessage = errorData.detail;
                }
            } else if (errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) { 
            try {
                const text = await response.text();
                if (text) errorMessage = text;
            } catch (t_e) { /* ignore */ }
        }
        throw new Error(errorMessage);
    }
    
    return await response.json();
};

export const fetchProjectDetails = async (projectId) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch project details');
    return await response.json();
};

export const fetchProjectPreview = async (projectId) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/preview`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch project preview');
    return await response.json();
};

export const updateProject = async (projectId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return await response.json();
};

export const deleteProject = async (projectId) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return await response.json();
};

export const bulkDeleteProjects = async (projectIds) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/bulk-delete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ project_ids: projectIds }),
    });
    if (!response.ok) throw new Error('Failed to delete projects');
    return await response.json();
};

export const saveFile = async (projectId, filename, content) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/files/${filename}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to save file');
    return await response.json();
};

export const deleteFile = async (projectId, filename) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete file');
    return await response.json();
};

/**
 * Generate project plan from transcript
 * @param {string} transcript 
 * @param {string|null} imageBase64 
 */
export const generatePlan = async (transcript, imageBase64 = null) => {
    const body = { transcript };
    if (imageBase64) body.image = imageBase64;
    const response = await fetch(`${API_BASE_URL}/api/plan`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        let errorMessage = response.statusText;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch (e) {
            // Ignore parsing error
        }
        throw new Error(`API Error: ${errorMessage}`);
    }

    return await response.json();
};

/**
 * Generate website from voice transcript or plan using SSE
 * @param {string|null} transcript - User's voice input (or null if using plan)
 * @param {object|null} plan - Project plan (or null if using transcript)
 * @param {string|null} imageBase64 - Base64 image
 * @param {string|null} projectId - Project ID
 * @param {function} onEvent - Callback for SSE events
 * @param {function} onError - Callback for errors
 * @param {function} onComplete - Callback when generation is done
 */
export const generateWebsite = async (transcript, plan, projectId, imageBase64, onEvent, onError, onComplete) => {
    try {
        const body = {};
        if (transcript) body.transcript = transcript;
        if (plan) body.plan = plan;
        if (projectId) body.project_id = projectId;
        if (imageBase64) body.image = imageBase64;
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Keep the last incomplete chunk

            for (const line of lines) {
                if (line.trim() === '') continue;

                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);

                    if (dataStr === '[DONE]') {
                        onComplete();
                        return;
                    }

                    try {
                        const event = JSON.parse(dataStr);
                        onEvent(event);
                    } catch (e) {
                        console.warn('Failed to parse SSE event:', dataStr);
                    }
                }
            }
        }

        // If we get here without returning, the stream closed without [DONE]
        throw new Error("Stream closed without completion signal");

    } catch (error) {
        console.error('Generation failed:', error);
        onError(error);
    }
};

/**
 * Launch preview server
 */
export const launchPreview = async () => {
    const response = await fetch(`${API_BASE_URL}/api/preview/launch`, {
        method: 'POST',
    });
    return await response.json();
};

/**
 * Edit existing project using SSE
 * @param {object} files - Current project files
 * @param {string|null} imageBase64 - User's explicit image addition
 * @param {function} onEvent - Callback for SSE events
 * @param {function} onError - Callback for errors
 * @param {function} onComplete - Callback when editing is done
 */
export const editProject = async (projectId, files, instruction, imageBase64, onEvent, onError, onComplete) => {
    try {
        const body = { files, instruction };
        if (projectId) body.project_id = projectId;
        if (imageBase64) body.image = imageBase64;
        const response = await fetch(`${API_BASE_URL}/api/edit`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;

                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') {
                        onComplete();
                        return;
                    }
                    try {
                        const event = JSON.parse(dataStr);
                        onEvent(event);
                    } catch (e) {
                        console.warn('Failed to parse SSE event:', dataStr);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Edit failed:', error);
        onError(error);
    }
};

/**
 * Stop preview server
 */
export const stopPreview = async () => {
    const response = await fetch(`${API_BASE_URL}/api/preview/stop`, {
        method: 'POST',
    });
    return await response.json();
};
