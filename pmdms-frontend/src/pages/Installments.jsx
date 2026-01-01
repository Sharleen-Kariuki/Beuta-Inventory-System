
import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import api from '../lib/axios'
import Modal from '../components/Modal'

export default function Installments() {
    const [installments, setInstallments] = useState([])
    const [loading, setLoading] = useState(true)
    const [isPayModalOpen, setIsPayModalOpen] = useState(false)
    const [selectedInstallment, setSelectedInstallment] = useState(null)
    const [paymentNotes, setPaymentNotes] = useState("")

    const fetchInstallments = async () => {
        try {
            const res = await api.get('/installments')
            setInstallments(res.data)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInstallments()
    }, [])

    const handlePay = async () => {
        if (!selectedInstallment) return
        try {
            await api.post(`/installments/${selectedInstallment.id}/pay`, { notes: paymentNotes })
            setIsPayModalOpen(false)
            setSelectedInstallment(null)
            setPaymentNotes("")
            fetchInstallments()
            alert("Payment recorded successfully!")
        } catch (err) {
            console.error(err)
            alert("Failed to record payment")
        }
    }

    const pendingInstallments = installments.filter(i => i.status === 'pending')
    const overdueInstallments = pendingInstallments.filter(i => new Date(i.due_date) < new Date())
    const totalPendingAmount = pendingInstallments.reduce((sum, i) => sum + parseFloat(i.amount), 0)

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading credit data...</div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Credits & Installments</h2>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>Track payments and due dates</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="bg-blue-50 p-3 rounded-xl">
                        <BanknotesIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Pending</p>
                        <p className="text-2xl font-bold text-slate-800">KSh {totalPendingAmount.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="bg-amber-50 p-3 rounded-xl">
                        <ClockIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Pending Count</p>
                        <p className="text-2xl font-bold text-slate-800">{pendingInstallments.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="bg-rose-50 p-3 rounded-xl">
                        <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Overdue</p>
                        <p className="text-2xl font-bold text-rose-600">{overdueInstallments.length}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Recent Installments</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Customer / Invoice</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {installments.map(inst => {
                                const isOverdue = inst.status === 'pending' && new Date(inst.due_date) < new Date();
                                return (
                                    <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{inst.sale?.customer?.name}</div>
                                            <div className="text-xs text-slate-400 font-mono">#{inst.sale?.invoice_no}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-700">KSh {parseFloat(inst.amount).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                                                {new Date(inst.due_date).toLocaleDateString()}
                                            </span>
                                            {isOverdue && <span className="ml-2 text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase">Overdue</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inst.status === 'paid' ? (
                                                <span className="inline-flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
                                                    <CheckCircleIcon className="h-3 w-3" />
                                                    <span>Paid</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
                                                    <ClockIcon className="h-3 w-3" />
                                                    <span>Pending</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {inst.status === 'pending' && (
                                                <button
                                                    onClick={() => { setSelectedInstallment(inst); setIsPayModalOpen(true); }}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-teal-600/20"
                                                >
                                                    Record Payment
                                                </button>
                                            )}
                                            {inst.status === 'paid' && (
                                                <span className="text-xs text-slate-400 italic">
                                                    Paid on {new Date(inst.paid_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {installments.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            No installments found.
                        </div>
                    )}
                </div>
            </div>

            {/* Pay Modal */}
            <Modal
                isOpen={isPayModalOpen}
                onClose={() => { setIsPayModalOpen(false); setSelectedInstallment(null); }}
                title="Record Installment Payment"
            >
                {selectedInstallment && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Customer</span>
                                <span className="font-semibold">{selectedInstallment.sale?.customer?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Invoice</span>
                                <span className="font-mono">{selectedInstallment.sale?.invoice_no}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                <span className="text-slate-700 font-medium">Amount to Pay</span>
                                <span className="text-xl font-bold text-teal-700">KSh {parseFloat(selectedInstallment.amount).toLocaleString()}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                            <textarea
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500"
                                placeholder="E.g., paid via M-Pesa, receipt #..."
                                rows="3"
                            ></textarea>
                        </div>

                        <div className="pt-4 flex justify-end space-x-3">
                            <button
                                onClick={() => { setIsPayModalOpen(false); setSelectedInstallment(null); }}
                                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePay}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 shadow-lg shadow-teal-600/20"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
