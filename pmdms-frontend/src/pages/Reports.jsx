
import React, { useState, useEffect } from 'react'
import api from '../lib/axios'
import { DocumentChartBarIcon, BanknotesIcon, ExclamationTriangleIcon, CalculatorIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function ReportsView() {
    const [activeTab, setActiveTab] = useState('sales')
    const [salesData, setSalesData] = useState(null)
    const [inventoryData, setInventoryData] = useState(null)
    const [financialsData, setFinancialsData] = useState(null)
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
                    setError("Failed to load sales data.")
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
        } else if (activeTab === 'financials') {
            // For financials, standardizing on current month for P&L usually, but supporting matching range
            // Let's stick to Month-to-Date for P&L or the selected range.
            // Using selected date range for consistency.
            const endDate = new Date().toISOString().split('T')[0]
            const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            api.get(`/reports/financials?start_date=${startDate}&end_date=${endDate}`)
                .then(res => setFinancialsData(res.data))
                .catch(err => {
                    console.error(err)
                    setError("Failed to load financial data.")
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800">Business Analytics</h2>

                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'sales' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Sales Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('financials')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'financials' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        P&L Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Inventory Health
                    </button>
                </div>
            </div>

            {loading && <div className="text-center py-12 text-slate-400 animate-pulse">Processing data...</div>}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-200">
                    {error}
                </div>
            )}

            {/* FINANCIALS TAB */}
            {!loading && !error && activeTab === 'financials' && financialsData && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-700">Profit & Loss Statement (Audit-Ready)</h3>
                        <div className="flex text-sm space-x-2">
                            <span>Period:</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300">Last {dateRange} Days</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Revenue"
                            value={`KSh ${parseFloat(financialsData.revenue).toLocaleString()}`}
                            subtext="Gross Sales"
                            icon={BanknotesIcon}
                            color="blue"
                        />
                        <StatCard
                            title="Cost of Goods Sold"
                            value={`KSh ${parseFloat(financialsData.cogs).toLocaleString()}`}
                            subtext="Raw Material Cost"
                            icon={CalculatorIcon}
                            color="orange"
                        />
                        <StatCard
                            title="Gross Profit"
                            value={`KSh ${parseFloat(financialsData.gross_profit).toLocaleString()}`}
                            subtext="Revenue - COGS"
                            icon={ArrowTrendingUpIcon}
                            color={financialsData.gross_profit >= 0 ? 'emerald' : 'red'}
                        />
                        <StatCard
                            title="Net Profit"
                            value={`KSh ${parseFloat(financialsData.net_profit).toLocaleString()}`}
                            subtext="Gross Profit - Expenses"
                            icon={BanknotesIcon}
                            color={financialsData.net_profit >= 0 ? 'teal' : 'rose'}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* THE STATEMENT */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-800 text-lg mb-6 text-center border-b pb-4">Standard P&L</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm text-slate-600">
                                        <span>Total Revenue</span>
                                        <span className="font-medium text-slate-900">KSh {financialsData.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-red-500">
                                        <span>(Less) Cost of Goods Sold</span>
                                        <span className="font-medium">- KSh {financialsData.cogs.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center font-bold text-slate-800">
                                        <span>Gross Profit</span>
                                        <span>KSh {financialsData.gross_profit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-red-500 pt-2">
                                        <span>(Less) Operating Expenses</span>
                                        <span className="font-medium">- KSh {financialsData.expenses_total.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t-2 border-slate-800 my-2 pt-2 flex justify-between items-center font-black text-xl text-slate-900 bg-slate-50 p-3 rounded-lg mt-4">
                                        <span>NET PROFIT</span>
                                        <span className={`${financialsData.net_profit >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                                            KSh {financialsData.net_profit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Operating Expenses List */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">Operating Expenses Audit</h4>
                                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                                    {financialsData.expenses_list?.map(exp => (
                                        <div key={exp.id} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{exp.category || 'General Expense'}</p>
                                                <p className="text-xs text-slate-500">{exp.date} • {exp.description || 'No description'}</p>
                                            </div>
                                            <span className="text-sm font-bold text-red-600">KSh {parseFloat(exp.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {(!financialsData.expenses_list || financialsData.expenses_list.length === 0) && (
                                        <p className="text-slate-400 text-xs text-center py-4 italic">No expenses recorded in this period.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COGS CALCULATION BREAKDOWN */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-lg mb-2">COGS Calculation Breakdown</h4>
                            <p className="text-xs text-slate-500 mb-6 italic">Visualizing how recipe costs and quantities sold result in the total COGS.</p>

                            <div className="space-y-6">
                                {financialsData.cogs_breakdown?.map(item => (
                                    <div key={item.product_name} className="border border-slate-100 rounded-lg overflow-hidden">
                                        <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-100">
                                            <div>
                                                <span className="font-bold text-slate-700">{item.product_name}</span>
                                                <span className="text-xs text-slate-500 ml-2">({item.total_qty} units sold)</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Total Contribution</p>
                                                <p className="font-bold text-teal-600 text-sm">KSh {item.total_cogs.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <table className="w-full text-[11px] text-left">
                                                <thead>
                                                    <tr className="text-slate-400 uppercase tracking-tighter">
                                                        <th className="pb-2 font-medium">Raw Material</th>
                                                        <th className="pb-2 font-medium">Qty (per {item.recipe_details.base_quantity} units)</th>
                                                        <th className="pb-2 font-medium text-right">Cost/Unit</th>
                                                        <th className="pb-2 font-medium text-right">Ext. Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {item.recipe_details.raw_materials.map((rm, idx) => (
                                                        <tr key={idx} className="text-slate-600">
                                                            <td className="py-2">{rm.material}</td>
                                                            <td className="py-2">{rm.qty} {rm.unit}</td>
                                                            <td className="py-2 text-right">KSh {parseFloat(rm.cost_price).toLocaleString()}</td>
                                                            <td className="py-2 text-right">KSh {rm.total.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-50 font-bold text-slate-800">
                                                        <td colSpan="3" className="py-2 px-2 text-right">Recipe Total Cost:</td>
                                                        <td className="py-2 text-right">KSh {item.recipe_details.raw_materials.reduce((sum, rm) => sum + parseFloat(rm.total), 0).toLocaleString()}</td>
                                                    </tr>
                                                    <tr className="text-xs font-bold text-teal-700 bg-teal-50">
                                                        <td colSpan="3" className="py-2 px-2 text-right italic underline">Unit Cost (Recipe Cost / {item.recipe_details.base_quantity}):</td>
                                                        <td className="py-2 text-right">KSh {item.unit_cost.toLocaleString()}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div className="mt-4 flex justify-end items-center space-x-2 text-xs">
                                                <span className="text-slate-400 font-mono">Calculated as:</span>
                                                <span className="bg-slate-100 px-2 py-1 rounded font-bold text-slate-700">
                                                    KSh {item.unit_cost.toLocaleString()} (Unit Cost) × {item.total_qty} (Qty Sold) = KSh {item.total_cogs.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!financialsData.cogs_breakdown || financialsData.cogs_breakdown.length === 0) && (
                                    <div className="text-center py-12 text-slate-300">
                                        <p className="italic">No COGS data available for this period.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SALES TAB */}
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

            {/* INVENTORY TAB */}
            {!loading && !error && activeTab === 'inventory' && inventoryData && (
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
