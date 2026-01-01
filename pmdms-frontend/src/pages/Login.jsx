
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/axios'
import Particles from '../components/reactbits/Particles'

export default function Login() {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [error, setError] = React.useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await api.get('/sanctum/csrf-cookie', { baseURL: '' });
            const res = await api.post('/login', { email, password })

            localStorage.setItem('token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.user))

            navigate('/')
            window.location.reload()
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.message || 'Login failed')
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
            <Particles particleCount={150} particleColor="rgba(20, 184, 166, 0.5)" speed={0.2} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md ring-1 ring-white/10"
            >
                <div className="mb-8 text-center">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="h-16 w-16 bg-teal-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20"
                    >
                        <span className="text-white text-2xl font-bold">P</span>
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Sign in to manage your inventory</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-sm border border-red-500/20"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                        <input
                            type="email"
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg text-white px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all outline-none"
                            placeholder="admin@pmdms.local"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg text-white px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all"
                    >
                        Sign In
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )
}
