import { useState, useRef, useEffect } from 'react'
// useState — tracks messages, input text, and loading state
// useRef — lets us scroll to the bottom of the chat automatically
// useEffect — runs code when the component loads

import { useNavigate } from 'react-router-dom'
import { Send, Bot, User, BookOpen, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'

// This defines what a single chat message looks like
type Message = {
  id: string        // unique id for each message
  role: 'user' | 'assistant'  // who sent it
  content: string   // the message text
  timestamp: Date   // when it was sent
}

// These are quick prompt suggestions shown at the start
// so students know what they can ask
const SUGGESTED_PROMPTS = [
  'Explain quadratic equations with examples',
  'How does photosynthesis work?',
  'What is Newton\'s second law of motion?',
  'Explain the water cycle',
  'What are the causes of World War 1?',
  'How do I solve simultaneous equations?',
]

export default function AITutor() {
  const { } = useAuthStore()
  const navigate = useNavigate()

  // messages: the full chat history
  const [messages, setMessages] = useState<Message[]>([])
  // input: what the student is currently typing
  const [input, setInput] = useState('')
  // loading: true while waiting for Claude to respond
  const [loading, setLoading] = useState(false)
  // userId: we fetch this to save sessions to Supabase
  const [userId, setUserId] = useState<string | null>(null)

  // This ref points to the bottom of the chat
  // so we can auto-scroll when new messages arrive
  const bottomRef = useRef<HTMLDivElement>(null)

  // When the page loads, get the current user's session
  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }
      setUserId(session.user.id)
    }
    getUser()
  }, [navigate])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // This function sends the student's message to Claude
  async function sendMessage(text?: string) {
    // Use either the passed text (from suggestion buttons)
    // or whatever the student typed in the input box
    const messageText = text || input.trim()
    if (!messageText || loading) return

    // Add the student's message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call the Anthropic API directly from the frontend
      // In production we'd use a Supabase Edge Function for security
      // but this works perfectly for development
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: `You are an expert tutor helping Cameroonian students prepare for their exams including GCE O Level, GCE A Level, Engineering entrance, Medicine entrance, and Teachers Training entrance exams. 

Your role is to:
- Explain concepts clearly with examples relevant to the Cameroonian curriculum
- Break down complex topics into simple steps
- Use encouraging language to motivate students
- When solving problems, show all working steps clearly
- You can respond in English or French depending on what language the student uses
- Keep explanations concise but thorough`,

          messages: [
            // Send the full conversation history so Claude has context
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: 'user',
              content: messageText,
            },
          ],
        }),
      })

const data = await response.json()
const aiResponse = data.content[0].text

      // Add Claude's response to the chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // Save the interaction to our Supabase ai_sessions table
      if (userId) {
        await supabase.from('ai_sessions').insert({
          user_id: userId,
          session_type: 'GENERAL_TUTORING',
          user_prompt: messageText,
          ai_response: aiResponse,
          model_used: 'claude-sonnet-4-6',
          language: 'EN',
        })

        // Deduct one AI credit from the user's account
        await supabase.rpc('deduct_ai_credit', { p_user_id: userId })
      }
    } catch (error) {
      console.error('AI error:', error)
      // Show an error message in the chat if something goes wrong
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  // Allow sending message by pressing Enter
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 flex flex-col">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Bot className="text-indigo-600" size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">AI Tutor</h1>
              <p className="text-xs text-gray-400">Powered by Claude</p>
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* Empty state — shown before any messages */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <BookOpen className="text-indigo-600" size={32} />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  What would you like to learn today?
                </h2>
                <p className="text-gray-400 text-sm">
                  Ask me anything about your subjects — I'm here to help! 🎓
                </p>
              </div>

              {/* Suggestion buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 mb-6 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-indigo-600'
                  : 'bg-gray-100'
              }`}>
                {message.role === 'user'
                  ? <User size={16} className="text-white" />
                  : <Bot size={16} className="text-gray-600" />
                }
              </div>

              {/* Message bubble */}
              <div className={`max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
              }`}>
                {/* Split response by newlines to preserve formatting */}
                {message.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Loading indicator — shown while Claude is thinking */}
          {loading && (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot size={16} className="text-gray-600" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {/* Three bouncing dots to show Claude is thinking */}
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Invisible div at the bottom — we scroll to this */}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-100 px-8 py-4">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI tutor anything... (Press Enter to send)"
              rows={1}
              className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors duration-200"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors duration-200 flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            AI responses are for study guidance only. Always verify with your textbooks.
          </p>
        </div>

      </main>
    </div>
  )
}