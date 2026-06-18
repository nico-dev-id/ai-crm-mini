'use client'

import { useState } from 'react'

const API = 'http://localhost:8000'

export default function Register() {
  const [nama, setNama] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [pesan, setPesan] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleRegister = async () => {
    if (!nama || !email || !password) {
      setPesan('Semua field wajib diisi!')
      return
    }
    setLoading(true)
    setPesan('')

    try {
      const response = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, password })
      })

      const data = await response.json()
      setLoading(false)

      if (response.ok) {
        setPesan('✅ Registrasi berhasil! Mengarahkan ke login...')
        setTimeout(() => window.location.href = '/login', 1500)
      } else {
        setPesan(data.detail || 'Registrasi gagal!')
      }
    } catch (error) {
      setPesan('Server tidak dapat dihubungi!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-96 border border-slate-700">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤝</div>
          <h1 className="text-3xl font-bold text-white">CRM<span className="text-blue-400">AI</span></h1>
          <p className="text-slate-400 mt-1 text-sm">Buat akun baru</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama lengkap"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
          />

          {pesan && (
            <p className={`text-sm ${pesan.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {pesan}
            </p>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium transition"
          >
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </div>

        <p className="text-center text-sm mt-6 text-slate-400">
          Sudah punya akun?{' '}
          <a href="/login" className="text-blue-400 hover:underline font-medium">
            Masuk
          </a>
        </p>
      </div>
    </div>
  )
}