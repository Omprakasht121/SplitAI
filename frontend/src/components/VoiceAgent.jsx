"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * VoiceAgent Component
 * Handles voice input using Web Speech API
 * - Microphone button to start/stop recording
 * - Live transcript display
 * - Status indicators
 */
export default function VoiceAgent({ status, setStatus, transcript, onTranscriptSubmit }) {
    const [isListening, setIsListening] = useState(false)
    const [interimTranscript, setInterimTranscript] = useState('')
    const [finalTranscript, setFinalTranscript] = useState('')
    const recognitionRef = useRef(null)

    // Initialize Web Speech API
    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = typeof window !== 'undefined'
            ? window.SpeechRecognition || window.webkitSpeechRecognition
            : null

        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported in this browser')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
            setStatus('listening')
        }

        recognition.onresult = (event) => {
            let interim = ''
            let final = ''

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    final += result[0].transcript + ' '
                } else {
                    interim += result[0].transcript
                }
            }

            setFinalTranscript(final)
            setInterimTranscript(interim)
        }

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)
            setIsListening(false)
            setStatus('idle')
        }

        recognition.onend = () => {
            setIsListening(false)
            // If we have a transcript, submit it
            const fullTranscript = (finalTranscript + interimTranscript).trim()
            if (fullTranscript) {
                onTranscriptSubmit(fullTranscript)
            } else {
                setStatus('idle')
            }
        }

        recognitionRef.current = recognition

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
        }
    }, [finalTranscript, interimTranscript, onTranscriptSubmit, setStatus])

    /**
     * Toggle microphone on/off
     */
    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return

        if (isListening) {
            recognitionRef.current.stop()
        } else {
            setFinalTranscript('')
            setInterimTranscript('')
            recognitionRef.current.start()
        }
    }, [isListening])

    /**
     * Get status message based on current status
     */
    const getStatusMessage = () => {
        switch (status) {
            case 'listening':
                return '🎤 Listening...'
            case 'processing':
                return '🧠 Planning project...'
            case 'generating':
                return '⚡ Generating code...'
            case 'complete':
                return '✅ Generation complete!'
            default:
                return 'Click the microphone to start'
        }
    }

    /**
     * Get button class based on state
     */
    const getMicButtonClass = () => {
        let className = 'mic-button'
        if (isListening) className += ' listening'
        if (status === 'processing' || status === 'generating') className += ' disabled'
        return className
    }

    const displayTranscript = isListening
        ? (finalTranscript + interimTranscript)
        : transcript

    return (
        <div className="voice-agent">
            <div className="voice-agent-header">
                <h3>🎙️ Voice Agent</h3>
            </div>

            {/* Status Display */}
            <div className="voice-status">
                <span className={`status-indicator status-${status}`}></span>
                <span className="status-text">{getStatusMessage()}</span>
            </div>

            {/* Microphone Button */}
            <div className="mic-container">
                <button
                    className={getMicButtonClass()}
                    onClick={toggleListening}
                    disabled={status === 'processing' || status === 'generating'}
                >
                    <span className="mic-icon-large">
                        {isListening ? '🔴' : '🎤'}
                    </span>
                </button>
                {isListening && (
                    <div className="pulse-ring"></div>
                )}
            </div>

            {/* Transcript Display */}
            <div className="transcript-container">
                <h4>Transcript</h4>
                <div className="transcript-box">
                    {displayTranscript || (
                        <span className="placeholder">
                            Your voice input will appear here...
                        </span>
                    )}
                    {isListening && <span className="cursor-blink">|</span>}
                </div>
            </div>

            {/* Tips */}
            <div className="voice-tips">
                <h4>💡 Tips</h4>
                <ul>
                    <li>Speak clearly and describe your website idea</li>
                    <li>Example: &quot;Create a marketing website for my college&quot;</li>
                    <li>Click the mic again to stop and submit</li>
                </ul>
            </div>
        </div>
    )
}
