'use client'

interface NavbarProps {
  nama?: string
}

export default function Navbar({ nama }: NavbarProps) {
  const logout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🤝</span>
        <span className="text-xl font-bold text-white">
          CRM<span className="text-blue-400">AI</span>
        </span>
      </div>

      <div className="flex items-center gap-6">
        <a href="/dashboard" className="text-slate-300 hover:text-white text-sm transition">
          Dashboard
        </a>
        <a href="/customers" className="text-slate-300 hover:text-white text-sm transition">
          Customers
        </a>
        <div className="flex items-center gap-3">
          {nama && (
            <span className="text-slate-400 text-sm">Halo, {nama}!</span>
          )}
          <button
            onClick={logout}
            className="bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg text-sm hover:bg-slate-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}