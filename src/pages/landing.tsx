// src/pages/Landing.tsx
// This is the first page every student sees when they visit LearnWitMe.
// It has 3 sections: Navbar, Hero, and Features.

import { BookOpen, Brain, FileText, CheckCircle, ArrowRight } from 'lucide-react'
// BookOpen — used for the logo
// Brain — used for the AI tutor feature card
// FileText — used for the past papers feature card
// CheckCircle — used for the bullet points
// ArrowRight — used for the call-to-action button

import { supabase } from '../lib/supabase'
// We import our Supabase client so we can trigger Google sign-in

// This function handles what happens when the student clicks "Sign in with Google"
async function handleGoogleSignIn() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // After Google authenticates the user, send them back to our /auth/callback page
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) {
    console.error('Error signing in with Google:', error.message)
  }
}

export default function Landing() {
  return (
    // min-h-screen — makes the page at least as tall as the screen
    // bg-white — white background
    <div className="min-h-screen bg-white">

      {/* ============ NAVBAR ============ */}
      {/* sticky top-0 — navbar stays at top when scrolling */}
      {/* z-50 — makes sure navbar stays above other elements */}
      {/* border-b — adds a subtle bottom border */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo — left side of navbar */}
          <div className="flex items-center gap-2">
            {/* The BookOpen icon in indigo color */}
            <BookOpen className="text-indigo-600" size={28} />
            {/* App name in bold */}
            <span className="text-xl font-bold text-gray-900">
              Learn<span className="text-indigo-600">Wit</span>Me
            </span>
          </div>

          {/* Sign in button — right side of navbar */}
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Sign in with Google
          </button>
          {/* 
            className breakdown:
            - flex items-center gap-2: puts icon and text side by side
            - bg-indigo-600: indigo background
            - hover:bg-indigo-700: slightly darker on hover
            - text-white: white text
            - text-sm font-medium: small, medium-weight text
            - px-4 py-2: horizontal and vertical padding
            - rounded-lg: rounded corners
            - transition-colors duration-200: smooth color change on hover
          */}
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      {/* This is the big central section students see first */}
      <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        
        {/* Small badge above the heading */}
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <CheckCircle size={16} />
          <span>Built for Cameroonian Students 🇨🇲</span>
        </div>

        {/* Main heading */}
        {/* text-5xl: very large text | font-extrabold: extra bold | leading-tight: tight line spacing */}
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6 max-w-3xl">
          Study Smarter for Your{' '}
          <span className="text-indigo-600">Cameroonian Exams</span>
        </h1>

        {/* Subheading — describes what the app does */}
        <p className="text-xl text-gray-500 mb-10 max-w-2xl leading-relaxed">
          AI-powered lessons, revision questions, and past papers for GCE O Level, 
          A Level, Engineering, Medicine, and Teacher Training entrance exams.
        </p>

        {/* Main call-to-action button */}
        <button
          onClick={handleGoogleSignIn}
          className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-colors duration-200 shadow-lg shadow-indigo-200"
        >
          {/* Google logo SVG */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFF" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Continue with Google
          <ArrowRight size={20} />
        </button>

        {/* Trust note below button */}
        <p className="text-sm text-gray-400 mt-4">
          Free to start · No credit card required
        </p>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Section heading */}
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Everything you need to pass
          </h2>
          <p className="text-gray-500 text-center mb-12">
            One platform for all your exam preparation needs
          </p>

          {/* Feature cards grid */}
          {/* grid-cols-1: 1 column on mobile */}
          {/* md:grid-cols-3: 3 columns on medium screens and above */}
          {/* gap-6: space between cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Feature Card 1 — AI Tutor */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <Brain className="text-indigo-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Tutor</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Get instant explanations of any concept in English or French. 
                Ask anything — your AI tutor is available 24/7.
              </p>
            </div>

            {/* Feature Card 2 — Past Papers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <FileText className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Past Papers</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Access years of official past questions with detailed solutions 
                for GCE, Engineering, Medicine and more.
              </p>
            </div>

            {/* Feature Card 3 — Revision Questions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="text-purple-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Revision Questions</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Practice with topic-by-topic revision questions and track your 
                progress as you prepare for your exams.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        © 2026 LearnWitMe · Made with ❤️ for Cameroonian Students
      </footer>

    </div>
  )
}