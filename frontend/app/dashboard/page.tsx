'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'

const API = 'https://nico-dev-id-ai-crm-mini-api.hf.space'

interface DashboardData {
  total_customers: number
  prospect: number
  active: number
  inactive: number
  total_deals: number
  open_deals: number
  won_deals: number
  lost_deals: number
  total_nilai: number
  won_nilai: number
}

interface User {
  nama: string
  email: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

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
      const [profilRes, dashboardRes] = await Promise.all([
        fetch(`${API}/profil`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!profilRes.ok) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      const profil = await profilRes.json()
      const dashboard = await dashboardRes.json()

      setUser(profil)
      setData(dashboard)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (nilai: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(nilai)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar nama={user?.nama} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Selamat datang kembali, {user?.nama}!</p>
        </div>

        {/* Stats Grid */}
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Customers"
                value={data.total_customers}
                icon="👥"
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                title="Prospect"
                value={data.prospect}
                icon="🎯"
                color="bg-yellow-500/20 text-yellow-400"
              />
              <StatCard
                title="Active"
                value={data.active}
                icon="✅"
                color="bg-green-500/20 text-green-400"
              />
              <StatCard
                title="Inactive"
                value={data.inactive}
                icon="😴"
                color="bg-slate-500/20 text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Deals"
                value={data.total_deals}
                icon="💼"
                color="bg-purple-500/20 text-purple-400"
              />
              <StatCard
                title="Open"
                value={data.open_deals}
                icon="🔓"
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                title="Won"
                value={data.won_deals}
                icon="🏆"
                color="bg-green-500/20 text-green-400"
              />
              <StatCard
                title="Lost"
                value={data.lost_deals}
                icon="❌"
                color="bg-red-500/20 text-red-400"
              />
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-2">Total Pipeline</p>
                <p className="text-3xl font-bold text-white">{formatRupiah(data.total_nilai)}</p>
              </div>
              <div className="bg-slate-800 border border-green-500/30 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-2">Revenue (Won)</p>
                <p className="text-3xl font-bold text-green-400">{formatRupiah(data.won_nilai)}</p>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <a
              href="/customers"
              className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition font-medium"
              >
              👥 Lihat Customers
            </a>
            <a
              href="/customers"
              className="bg-slate-700 text-white px-6 py-3 rounded-xl hover:bg-slate-600 transition font-medium"
            >
              ➕ Tambah Customer
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}