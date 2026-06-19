'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

const API = 'https://nico-dev-id-ai-crm-mini-api.hf.space'

interface Customer {
  id: number
  nama: string
  email: string
  telepon: string
  perusahaan: string
  status: string
  catatan: string
  total_deals: number
  total_nilai: number
}

interface User {
  nama: string
  email: string
}

export default function Customers() {
  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    perusahaan: '',
    status: 'prospect',
    catatan: ''
  })
  const [pesan, setPesan] = useState<string>('')

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
      const [profilRes, customersRes] = await Promise.all([
        fetch(`${API}/profil`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!profilRes.ok) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      const profil = await profilRes.json()
      const customersData = await customersRes.json()

      setUser(profil)
      setCustomers(customersData.customers || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const tambahCustomer = async () => {
    if (!formData.nama) {
      setPesan('Nama customer wajib diisi!')
      return
    }

    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setPesan('✅ Customer berhasil ditambahkan!')
      setFormData({ nama: '', email: '', telepon: '', perusahaan: '', status: 'prospect', catatan: '' })
      setShowForm(false)
      ambilData(token!)
    } else {
      setPesan('Gagal menambahkan customer!')
    }
  }

  const hapusCustomer = async (id: number, nama: string) => {
    if (!confirm(`Hapus customer "${nama}"?`)) return
    const token = localStorage.getItem('token')
    await fetch(`${API}/customers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    ambilData(token!)
  }

  const statusColor: Record<string, string> = {
    prospect: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    inactive: 'bg-slate-500/20 text-slate-400'
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-slate-400 mt-1">{customers.length} customer terdaftar</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition font-medium"
          >
            {showForm ? '✕ Tutup' : '➕ Tambah Customer'}
          </button>
        </div>

        {/* Form Tambah Customer */}
        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-bold mb-4">Tambah Customer Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nama lengkap *"
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
              />
              <input
                type="text"
                placeholder="Nomor telepon"
                value={formData.telepon}
                onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
              />
              <input
                type="text"
                placeholder="Perusahaan"
                value={formData.perusahaan}
                onChange={(e) => setFormData({...formData, perusahaan: e.target.value})}
                className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400"
              >
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <textarea
                placeholder="Catatan"
                value={formData.catatan}
                onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-blue-400 placeholder-slate-400"
                rows={1}
              />
            </div>
            {pesan && (
              <p className={`mt-3 text-sm ${pesan.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {pesan}
              </p>
            )}
            <button
              onClick={tambahCustomer}
              className="mt-4 bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition font-medium"
            >
              Simpan Customer
            </button>
          </div>
        )}

        {/* List Customers */}
        {customers.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-slate-400">Belum ada customer. Tambahkan sekarang!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {customers.map((customer) => (
              <div key={customer.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex justify-between items-center hover:border-slate-600 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-xl">
                    {customer.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-white font-semibold">{customer.nama}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[customer.status]}`}>
                        {customer.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">{customer.perusahaan || 'Tidak ada perusahaan'}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {customer.total_deals} deals · {formatRupiah(customer.total_nilai)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/customers/${customer.id}`}
                    className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition"
                  >
                    Detail
                  </a>
                  <button
                    onClick={() => hapusCustomer(customer.id, customer.nama)}
                    className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}