import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import {
  BeakerIcon,
  ArrowTrendingUpIcon,
  WalletIcon,
  ArrowRightOnRectangleIcon,
  DocumentChartBarIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  TagIcon,
  CubeIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import Login from './pages/Login'
import InventoryView from './pages/Inventory'
import SalesView from './pages/Sales'
import ProductionView from './pages/Production'
import ReportsView from './pages/Reports'
import SuppliersView from './pages/Suppliers'
import ProductsView from './pages/Products'
import InstallmentsView from './pages/Installments'
import CustomersView from './pages/Customers'
import { SpotlightCard } from './components/reactbits/SpotlightCard'
import api from './lib/axios'

// Simple Auth Guard
function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  )
}

function DashboardLayout() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8 text-teal-400">Beuta Paints</h1>
        <nav className="space-y-4 flex-1">
          <Link to="/" className="flex items-center space-x-2 text-slate-300 hover:text-white">
            <ArrowTrendingUpIcon className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/inventory" className="flex items-center space-x-2 text-slate-300 hover:text-white">
            <BeakerIcon className="h-5 w-5" />
            <span>Inventory</span>
          </Link>
          <Link to="/sales" className="flex items-center space-x-2 text-slate-300 hover:text-white">
            <WalletIcon className="h-5 w-5" />
            <span>Sales</span>
          </Link>
          <Link to="/credits" className="flex items-center space-x-2 text-slate-300 hover:text-white">
            <ClockIcon className="h-5 w-5" />
            <span>Credits</span>
          </Link>
          <Link to="/production" className="flex items-center space-x-2 text-slate-300 hover:text-white">
            <BeakerIcon className="h-5 w-5" />
            <span>Production</span>
          </Link>
          <Link to="/reports" className="flex items-center space-x-2 text-slate-300 hover:text-white">
            <DocumentChartBarIcon className="h-5 w-5" />
            <span>Reports</span>
          </Link>
          <div className="pt-4 mt-4 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-4">Management</span>
            <Link to="/suppliers" className="flex items-center space-x-2 text-slate-300 hover:text-white mb-4">
              <TruckIcon className="h-5 w-5" />
              <span>Suppliers</span>
            </Link>
            <Link to="/customers" className="flex items-center space-x-2 text-slate-300 hover:text-white mb-4">
              <UserGroupIcon className="h-5 w-5" />
              <span>Customers</span>
            </Link>
            <Link to="/products-list" className="flex items-center space-x-2 text-slate-300 hover:text-white">
              <TagIcon className="h-5 w-5" />
              <span>Products</span>
            </Link>
          </div>
        </nav>
        <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-400 hover:text-red-400 mt-auto">
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Overview</h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="block text-sm font-bold text-slate-700">{user.name}</span>
              <span className="block text-xs text-slate-500 uppercase">{user.role}</span>
            </div>
            <div className="h-10 w-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
              {user.name ? user.name[0] : 'U'}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardStats />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route path="/sales" element={<SalesView />} />
          <Route path="/credits" element={<InstallmentsView />} />
          <Route path="/production" element={<ProductionView />} />
          <Route path="/reports" element={<ReportsView />} />
          <Route path="/suppliers" element={<SuppliersView />} />
          <Route path="/customers" element={<CustomersView />} />
          <Route path="/products-list" element={<ProductsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function DashboardStats() {
  const [stats, setStats] = useState({
    sales: { today: 0, change: 0, total_orders: 0 },
    production: { pending: 0, today: 0 },
    inventory: { low_stock: 0 }
  })
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Dynamic motivational quotes
  const quotes = [
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "Excellence is not a destination; it is a continuous journey that never ends.", author: "Brian Tracy" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Your work is going to fill a large part of your life, make it meaningful.", author: "Steve Jobs" }
  ]

  const [dailyQuote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)])

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => {
        setStats(res.data)
        setLoading(false)
      })
      .catch(err => console.error(err)) // Quiet fail for dashboard
  }, [])

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-400">Loading metrics...</div>

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-8 rounded-2xl shadow-lg overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            {getGreeting()}, {user.name || 'Partner'}! 👋
          </h1>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-white text-lg italic mb-2">"{dailyQuote.text}"</p>
            <p className="text-teal-100 text-sm">— {dailyQuote.author}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <SpotlightCard>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Daily Sales</h3>
                <div className="flex items-center mt-2">
                  <span className="text-3xl font-bold text-slate-900">KSh {stats.sales.today.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-2 bg-teal-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div className={`mt-4 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${stats.sales.change >= 0 ? 'text-emerald-600 bg-emerald-100' : 'text-red-600 bg-red-100'}`}>
              {stats.sales.change >= 0 ? '↑' : '↓'} {Math.abs(stats.sales.change)}% from yesterday
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Total Orders</h3>
                <div className="flex items-center mt-2">
                  <span className="text-3xl font-bold text-slate-900">{stats.sales.total_orders || 0}</span>
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full inline-block">
              All Time
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Production Runs</h3>
                <div className="flex items-center mt-2">
                  <span className="text-3xl font-bold text-slate-900">{stats.production.today || 0}</span>
                </div>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
              {stats.production.pending} Pending
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Credits Due</h3>
                <div className="flex items-center mt-2">
                  <span className={`text-3xl font-bold ${stats.credits?.overdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {stats.credits?.overdue || 0}
                  </span>
                </div>
              </div>
              <div className="p-2 bg-rose-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            <div className="mt-4 flex flex-col space-y-1">
              <span className="text-xs font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full self-start">
                {stats.credits?.overdue || 0} Overdue
              </span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full self-start">
                {stats.credits?.upcoming || 0} Upcoming
              </span>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Low Stock</h3>
                <div className="flex items-center mt-2">
                  <span className="text-3xl font-bold text-slate-900">{stats.inventory.low_stock}</span>
                </div>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stats.inventory.low_stock > 0 ? 'text-orange-600 bg-orange-100' : 'text-emerald-600 bg-emerald-100'}`}>
                {stats.inventory.low_stock > 0 ? 'Restock Required' : 'Inventory Healthy'}
              </span>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  )
}

export default App
