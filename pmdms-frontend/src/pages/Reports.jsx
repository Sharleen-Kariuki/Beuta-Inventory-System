
import React, { useState, useEffect } from 'react'
import api from '../lib/axios'
import { DocumentChartBarIcon, BanknotesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function ReportsView() {
    const [activeTab, setActiveTab] = useState('sales')
    const [salesData, setSalesData] = useState(null)
    const [inventoryData, setInventoryData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [dateRange, setDateRange] = useState('30') // days

    useEffect(() => {
        setLoading(true)
        setError(null)
        if (activeTab === 'sales') {
            const endDate = new Date().toISOString().split('T')[0]
            const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            api.get(`/reports/sales?start_date=${startDate}&end_date=${endDate}`)
                .then(res => setSalesData(res.data))
                .catch(err => {
                    console.error(err)
                    setError("Failed to load sales data. Please try again.")
                })
                .finally(() => setLoading(false))
        } else if (activeTab === 'inventory') {
            api.get('/reports/inventory')
                .then(res => setInventoryData(res.data))
                .catch(err => {
                    console.error(err)
                    setError("Failed to load inventory data.")
                })
                .finally(() => setLoading(false))
        }
    }, [activeTab, dateRange])

    const StatCard = ({ title, value, subtext, icon: Icon, color = "teal" }) => (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Business Reports</h2>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sales' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Sales Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Inventory Health
                    </button>
                </div>
            </div>

            {loading && <div className="text-center py-12 text-slate-400 animate-pulse">Running analysis...</div>}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-200">
                    {error}
                </div>
            )}

            {!loading && !error && activeTab === 'sales' && salesData && (
                <div className="space-y-6">
                    <div className="flex justify-end space-x-2 text-sm">
                        <span>Last:</span>
                        {[7, 30, 90].map(d => (
                            <button
                                key={d}
                                onClick={() => setDateRange(d)}
                                className={`px-2 py-0.5 rounded ${dateRange == d ? 'bg-teal-100 text-teal-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {d} Days
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard
                            title="Total Revenue"
                            value={`KSh ${parseFloat(salesData.summary.total_revenue).toLocaleString()}`}
                            subtext={`Over last ${dateRange} days`}
                            icon={BanknotesIcon}
                        />
                        <StatCard
                            title="Total Transactions"
                            value={salesData.summary.total_sales}
                            subtext="Processed invoices"
                            icon={DocumentChartBarIcon}
                            color="blue"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Trend Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-4">Daily Revenue Trend</h3>
                            {salesData.daily.length === 0 ? (
                                <p className="text-slate-400 text-sm italic">No sales in this period.</p>
                            ) : (
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={salesData.daily}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(val) => `KSh ${val}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                                formatter={(value) => [`KSh ${parseFloat(value).toLocaleString()}`, 'Revenue']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="daily_total"
                                                stroke="#0d9488"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Top Products */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                            <h3 className="font-bold text-slate-700 mb-4">Top Best Sellers</h3>
                            <div className="space-y-4">
                                {salesData.top_products.map((item, index) => (
                                    <div key={item.product_id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{item.product?.name}</p>
                                                <p className="text-xs text-slate-500">{item.total_qty} units sold</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">KSh {parseFloat(item.total_revenue).toLocaleString()}</span>
                                    </div>
                                ))}
                                {salesData.top_products.length === 0 && <p className="text-slate-400 text-sm">No data available.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'inventory' && inventoryData && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Raw Material Value"
                            value={`KSh ${parseFloat(inventoryData.valuation.raw_materials).toLocaleString()}`}
                            subtext="Asset Cost"
                            icon={BanknotesIcon}
                            color="amber"
                        />
                        <StatCard
                            title="Est. Finished Goods Value"
                            value={`KSh ${parseFloat(inventoryData.valuation.products_potential).toLocaleString()}`}
                            subtext="Potential Revenue"
                            icon={BanknotesIcon}
                            color="emerald"
                        />
                        <StatCard
                            title="Low Stock Alerts"
                            value={inventoryData.low_stock.raw_materials.length + inventoryData.low_stock.products.length}
                            subtext="Items requiring action"
                            icon={ExclamationTriangleIcon}
                            color="red"
                        />
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-red-600 mb-4 flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                            Critical Stock Levels
                        </h3>

                        {(inventoryData.low_stock.raw_materials.length === 0 && inventoryData.low_stock.products.length === 0) ? (
                            <div className="text-center py-8 text-green-600 bg-green-50 rounded-lg">
                                <p>All items are healthy! No stock alerts.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {inventoryData.low_stock.raw_materials.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Raw Materials</h4>
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="bg-red-50 text-red-800">
                                                    <th className="p-2 rounded-l">Name</th>
                                                    <th className="p-2">Current</th>
                                                    <th className="p-2 rounded-r">Reorder Level</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inventoryData.low_stock.raw_materials.map(m => (
                                                    <tr key={m.id} className="border-b border-slate-100">
                                                        <td className="p-2 font-medium">{m.name}</td>
                                                        <td className="p-2 text-red-600 font-bold">{m.current_stock} {m.unit}</td>
                                                        <td className="p-2 text-slate-500">{m.reorder_level} {m.unit}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {inventoryData.low_stock.products.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Finished Products</h4>
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="bg-orange-50 text-orange-800">
                                                    <th className="p-2 rounded-l">Name</th>
                                                    <th className="p-2">Current</th>
                                                    <th className="p-2 rounded-r">Min Level</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inventoryData.low_stock.products.map(p => (
                                                    <tr key={p.id} className="border-b border-slate-100">
                                                        <td className="p-2 font-medium">{p.name}</td>
                                                        <td className="p-2 text-orange-600 font-bold">{p.current_stock}</td>
                                                        <td className="p-2 text-slate-500">{p.min_stock_level}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
