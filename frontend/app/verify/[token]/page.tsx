'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const API = `${API_BASE.replace(/\/$/, '')}/api`;

export default function VerifyEmailPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token tidak valid')
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${API}/auth/verify/${token}`)
        const data = await res.json()

        if (res.ok && data.verified) {
          setStatus('success')
          setMessage(data.message || 'Email berhasil diverifikasi!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verifikasi gagal')
        }
      } catch {
        setStatus('error')
        setMessage('Terjadi kesalahan. Silakan coba lagi.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-slate-700">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <h1 className="text-2xl font-bold text-white mb-2">Memverifikasi Email...</h1>
            <p className="text-slate-400">Mohon tunggu sebentar</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifikasi Berhasil!</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <Link
              href="/admin/login"
              className="inline-block bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
            >
              Login Sekarang
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifikasi Gagal</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/admin/register"
                className="block bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200"
              >
                Daftar Ulang
              </Link>
              <Link
                href="/admin/login"
                className="block text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Kembali ke Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
