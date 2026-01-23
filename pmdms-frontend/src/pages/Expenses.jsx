
import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import api from '../lib/axios'
import Modal from '../components/Modal'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { MonthFolder } from '../components/reactbits/MonthFolder'

export default function ExpensesView() {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [openFolder, setOpenFolder] = useState(null)

    const { register, handleSubmit, reset, setValue } = useForm()

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses')
            setExpenses(res.data)

            // Auto open the most recent month if available
            if (res.data.length > 0) {
                const latestMonth = format(parseISO(res.data[0].date), 'MMMM yyyy')
                setOpenFolder(latestMonth)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExpenses()
    }, [])

    const openAddModal = () => {
        setEditingItem(null)
        reset({
            date: new Date().toISOString().split('T')[0]
        })
        setIsModalOpen(true)
    }

    const openEditModal = (item) => {
        setEditingItem(item)
        setValue('category', item.category)
        setValue('amount', item.amount)
        setValue('date', item.date)
        setValue('description', item.description)
        setIsModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return
        try {
            await api.delete(`/expenses/${id}`)
            fetchExpenses()
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete expense")
        }
    }

    const onSubmit = async (data) => {
        try {
            if (editingItem) {
                await api.put(`/expenses/${editingItem.id}`, data)
            } else {
                await api.post('/expenses', data)
            }
            setIsModalOpen(false)
            fetchExpenses()
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed")
        }
    }

    // Group expenses by month
    const groupedExpenses = expenses.reduce((acc, exp) => {
        const month = format(parseISO(exp.date), 'MMMM yyyy');
        if (!acc[month]) acc[month] = [];
        acc[month].push(exp);
        return acc;
    }, {});

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading expenses...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Operational Expenses</h2>
                    <p className="text-slate-500 text-sm">Track your overheads and operational costs</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span className="font-bold">Record Expense</span>
                </button>
            </div>

            <div className="space-y-4">
                {Object.keys(groupedExpenses).map(month => {
                    const monthData = groupedExpenses[month]
                    const totalMonthAmount = monthData.reduce((sum, item) => sum + parseFloat(item.amount), 0)

                    return (
                        <MonthFolder
                            key={month}
                            monthLabel={month}
                            count={monthData.length}
                            totalAmount={totalMonthAmount}
                            isOpen={openFolder === month}
                            onToggle={() => setOpenFolder(openFolder === month ? null : month)}
                        >
                            <div className="grid grid-cols-1 gap-3">
                                {monthData.map(item => (
                                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                        <div className="flex items-center space-x-5">
                                            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <div className="text-[10px] font-black uppercase text-center leading-tight">
                                                    {format(parseISO(item.date), 'MMM').toUpperCase()}<br />
                                                    <span className="text-lg">{format(parseISO(item.date), 'd')}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-black text-slate-900 truncate max-w-[200px]">{item.description || 'No Description'}</h4>
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tighter shadow-sm">{item.category}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">Recorded on {format(parseISO(item.date), 'PPPP')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-8">
                                            <div className="text-right">
                                                <span className="block font-black text-slate-900 text-lg">KSh {parseFloat(item.amount).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <button onClick={() => openEditModal(item)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90">
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MonthFolder>
                    )
                })}

                {expenses.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <PlusIcon className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">No expenses recorded yet</h3>
                        <p className="text-slate-400 text-sm">Start tracking your operational costs today.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Expense" : "Record New Expense"}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input type="date" {...register("date", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                            <input type="number" step="0.01" {...register("amount", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" placeholder="0.00" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select {...register("category", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border">
                            <option value="">Select Category</option>
                            <option value="Rent">Rent</option>
                            <option value="Salaries">Salaries</option>
                            <option value="Electricity">Electricity</option>
                            <option value="Water">Water</option>
                            <option value="Fuel">Fuel</option>
                            <option value="Transport">Transport</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                        <textarea {...register("description")} className="w-full border-slate-300 rounded-lg p-2 border h-20" placeholder="Additional details..." />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                            {editingItem ? 'Save Changes' : 'Record Expense'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
