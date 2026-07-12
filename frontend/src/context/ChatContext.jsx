import { createContext, useContext, useState, useCallback } from 'react'

const ChatContext = createContext()

const SYSTEM_PROMPT = `You are ASPA (Audio Signal Processing Assistant), an expert AI engineering assistant specializing in audio signal processing, electronics, and telecommunications engineering. 

You help users with:
- Audio circuit design: preamplifiers, amplifiers, filters (low-pass, high-pass, band-pass, notch), equalizers
- Signal analysis: frequency response, Bode plots, phase response, THD, SNR calculations
- Component selection: op-amps, resistors, capacitors, inductors for audio applications
- Troubleshooting audio circuits: noise, distortion, instability issues
- Filter design: Butterworth, Chebyshev, Bessel, Sallen-Key topology
- Amplifier classes: Class A, AB, B, D operation and efficiency
- Audio standards: balanced/unbalanced, impedance matching, dB calculations
- Telecommunications audio: codecs, sampling rates, quantization

Always provide:
1. Clear engineering explanations with formulas when applicable
2. Component values and practical design guidance
3. Safety considerations and standard practices
4. References to relevant standards (IEC, IEEE) when appropriate

Format responses clearly with sections when needed. Use engineering notation for values (k, M, µ, n, p).`

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hello! I'm **ASPA** — your Audio Signal Processing Assistant powered by IBM Granite AI.\n\nI specialize in:\n- 🔊 Audio circuit design (amplifiers, filters, equalizers)\n- 📊 Signal analysis and frequency response\n- 🔧 Troubleshooting and component selection\n- 📐 Filter design (Butterworth, Chebyshev, Sallen-Key)\n\nHow can I help you today? Try asking me to design a low-pass filter or calculate op-amp gain!`,
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [apiConfig, setApiConfig] = useState({
    apiKey: localStorage.getItem('aspa-api-key') || '',
    projectId: localStorage.getItem('aspa-project-id') || '',
    region: localStorage.getItem('aspa-region') || 'us-south',
  })

  const saveApiConfig = useCallback((config) => {
    setApiConfig(config)
    localStorage.setItem('aspa-api-key', config.apiKey)
    localStorage.setItem('aspa-project-id', config.projectId)
    localStorage.setItem('aspa-region', config.region)
  }, [])

  const sendMessage = useCallback(async (userText) => {
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const conversationHistory = messages
        .slice(-10)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

      conversationHistory.push({ role: 'user', content: userText })

      // Call the ASPA backend API, which securely handles Watsonx communication
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      })

      const data = await response.json()
      let responseText = ''

      if (response.ok && data.success) {
        responseText = data.message || data.recommendation || data.explanation
      } else {
        responseText = `⚠️ **Backend Error**\n\nThe server responded with an error or invalid data. Please check the backend logs.`
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `⚠️ **Connection Error**\n\nCould not reach the ASPA backend server. Please ensure the backend is running.`,
          timestamp: new Date(),
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const clearChat = useCallback(() => {
    setMessages([{
      id: 1,
      role: 'assistant',
      content: `Chat cleared! I'm ready to help with your audio engineering questions. What would you like to design or analyze?`,
      timestamp: new Date(),
    }])
  }, [])

  return (
    <ChatContext.Provider value={{ messages, isLoading, sendMessage, clearChat, apiConfig, saveApiConfig }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  return useContext(ChatContext)
}


