'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.location.href = '/login'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <p className="text-white">Loading...</p>
    </div>
  )
}