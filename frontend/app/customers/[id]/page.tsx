'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '../../components/Navbar'

const API = 'http://localhost:8000'

interface Deal {
  id: number
  judul: string
  nilai: number
  status: string
  catatan: string
  created_at: string
}

interface Customer {
  id: number
  nama: string
  email: string
  telepon: string
  perusahaan: string
  status: string
  catatan: string
  deals: Deal[]
}

interface User {
  nama: string
  email: string
}

export default function CustomerDetail() {
  const params = useParams()
  const id = params.id

  const [user, setUser] = useState<User | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showDealForm, setShowDealForm] = useState<boolean>(false)
  const [analisis, setAnalisis] = useState<string>('')
  const [loadingAnalisis, setLoadingAnalisis] = useState<boolean>(false)
  const [dealForm, setDealForm] = useState({
    judul: '',
    nilai: 0,
    status: 'open',
    catatan: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    ambilData(token)
  }, [])

  const ambilData = async (token: string) => {
    try {
      const [profilRes, customerRes] = await Promise.all([
        fetch(`${API}/profil`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/customers/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!profilRes.ok) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      const profil = await profilRes.json()
      const customerData = await customerRes.json()

      setUser(profil)
      setCustomer(customerData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const tambahDeal = async () => {
    if (!dealForm.judul) return

    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/customers/${id}/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dealForm)
    })

    if (res.ok) {
      setDealForm({ judul: '', nilai: 0, status: 'open', catatan: '' })
      setShowDealForm(false)
      ambilData(token!)
    }
  }

  const hapusDeal = async (dealId: number) => {
    if (!confirm('Hapus deal ini?')) return
    const token = localStorage.getItem('token')
    await fetch(`${API}/customers/${id}/deals/${dealId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    ambilData(token!)
  }

  const analisisAI = async () => {
    setLoadingAnalisis(true)
    setAnalisis('')
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/customers/${id}/analyze`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    setAnalisis(data.analisis)
    setLoadingAnalisis(false)
  }

  const formatRupiah = (nilai: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(nilai)
  }

  const statusDealColor: Record<string, string> = {
    open: 'bg-blue-500/20 text-blue-400',
    won: 'bg-green-500/20 text-green-400',
    lost: 'bg-red-500/20 text-red-400'
  }

  const statusCustomerColor: Record<string, string> = {
    prospect: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    inactive: 'bg-slate-500/20 text-slate-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Customer tidak ditemukan!</p>
      </div>
    )
  }

  const totalNilai = customer.deals.reduce((acc, d) => acc + d.nilai, 0)
  const wonNilai = customer.deals.filter(d => d.status === 'won').reduce((acc, d) => acc + d.nilai, 0)

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar nama={user?.nama} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Back button */}
        <a href="/customers" className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mb-6 transition">
          ← Kembali ke Customers
        </a>

        {/* Customer Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-3xl font-bold text-blue-400">
                {customer.nama.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{customer.nama}</h1>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusCustomerColor[customer.status]}`}>
                    {customer.status}
                  </span>
                </div>
                <p className="text-slate-400">{customer.perusahaan || 'Tidak ada perusahaan'}</p>
                <div className="flex gap-4 mt-2">
                  {customer.email && <p className="text-slate-500 text-sm">📧 {customer.email}</p>}
                  {customer.telepon && <p className="text-slate-500 text-sm">📞 {customer.telepon}</p>}
                </div>
              </div>
            </div>
            <button
              onClick={analisisAI}
              disabled={loadingAnalisis}
              className="bg-purple-500/20 text-purple-400 px-6 py-3 rounded-xl hover:bg-purple-500/30 transition font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loadingAnalisis ? '🤖 Menganalisis...' : '🤖 Analisis AI'}
            </button>
          </div>

          {customer.catatan && (
            <div className="mt-4 bg-slate-700/50 rounded-xl p-4">
              <p className="text-slate-400 text-sm">📝 {customer.catatan}</p>
            </div>
          )}
        </div>

        {/* AI Analysis Result */}
        {analisis && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 mb-6">
            <h2 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
              🤖 Analisis AI
            </h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {analisis}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Total Deals</p>
            <p className="text-3xl font-bold text-white mt-1">{customer.deals.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Total Pipeline</p>
            <p className="text-2xl font-bold text-white mt-1">{formatRupiah(totalNilai)}</p>
          </div>
          <div className="bg-slate-800 border border-green-500/30 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Revenue (Won)</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{formatRupiah(wonNilai)}</p>
          </div>
        </div>

        {/* Deals Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-bold text-lg">Deals</h2>
            <button
              onClick={() => setShowDealForm(!showDealForm)}
              className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition"
            >
              {showDealForm ? '✕ Tutup' : '➕ Tambah Deal'}
            </button>
          </div>

          {/* Deal Form */}
          {showDealForm && (
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Judul deal *"
                  value={dealForm.judul}
                  onChange={(e) => setDealForm({...dealForm, judul: e.target.value})}
                  className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
                />
                <input
                  type="number"
                  placeholder="Nilai (Rp)"
                  value={dealForm.nilai}
                  onChange={(e) => setDealForm({...dealForm, nilai: Number(e.target.value)})}
                  className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
                />
                <select
                  value={dealForm.status}
                  onChange={(e) => setDealForm({...dealForm, status: e.target.value})}
                  className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400"
                >
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                <input
                  type="text"
                  placeholder="Catatan"
                  value={dealForm.catatan}
                  onChange={(e) => setDealForm({...dealForm, catatan: e.target.value})}
                  className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
                />
              </div>
              <button
                onClick={tambahDeal}
                className="mt-3 bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition font-medium"
              >
                Simpan Deal
              </button>
            </div>
          )}

          {/* Deal List */}
          {customer.deals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">Belum ada deal. Tambahkan sekarang!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.deals.map((deal) => (
                <div key={deal.id} className="bg-slate-700/50 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-white font-medium">{deal.judul}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusDealColor[deal.status]}`}>
                        {deal.status}
                      </span>
                    </div>
                    <p className="text-blue-400 font-semibold mt-1">{formatRupiah(deal.nilai)}</p>
                    {deal.catatan && <p className="text-slate-500 text-xs mt-1">{deal.catatan}</p>}
                  </div>
                  <button
                    onClick={() => hapusDeal(deal.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}