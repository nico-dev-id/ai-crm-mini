'use client'

import { useState } from 'react'

const API = 'https://nico-dev-id-ai-crm-mini-api.hf.space'

export default function Login() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [pesan, setPesan] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setPesan('Email dan password wajib diisi!')
      return
    }
    setLoading(true)
    setPesan('')

    try {
      const response = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${email}&password=${password}`
      })

      if (!response.ok) {
        const data = await response.json()
        setPesan(data.detail || 'Login gagal!')
        setLoading(false)
        return
      }

      const data = await response.json()
      localStorage.setItem('token', data.access_token)
      window.location.href = '/dashboard'

    } catch (error) {
      setPesan('Server tidak dapat dihubungi, coba lagi!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-96 border border-slate-700">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤝</div>
          <h1 className="text-3xl font-bold text-white">CRM<span className="text-blue-400">AI</span></h1>
          <p className="text-slate-400 mt-1 text-sm">AI-Powered CRM Mini</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
          />

          {pesan && (
            <p className="text-red-400 text-sm">{pesan}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium transition"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </div>

        <p className="text-center text-sm mt-6 text-slate-400">
          Belum punya akun?{' '}
          <a href="/register" className="text-blue-400 hover:underline font-medium">
            Daftar sekarang
          </a>
        </p>
      </div>
    </div>
  )
}