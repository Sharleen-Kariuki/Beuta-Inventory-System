
import React, { useState, useEffect } from 'react'
import { PlusIcon, UserGroupIcon, PhoneIcon, TagIcon, CreditCardIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import api from '../lib/axios'
import Modal from '../components/Modal'
import { useForm } from 'react-hook-form'

export default function CustomersView() {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [customerHistory, setCustomerHistory] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")

    const { register, handleSubmit, reset, setValue } = useForm()

    const fetchCustomers = () => {
        setLoading(true)
        api.get('/customers')
            .then(res => {
                setCustomers(res.data)
                setLoading(false)
            })
            .catch(err => {
                console.error("Failed to fetch customers", err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const openAddModal = () => {
        setEditingCustomer(null)
        reset({ name: "", type: "retail", phone: "", credit_limit: 0 })
        setIsModalOpen(true)
    }

    const openEditModal = (customer) => {
        setEditingCustomer(customer)
        setValue('name', customer.name)
        setValue('type', customer.type)
        setValue('phone', customer.phone)
        setValue('credit_limit', customer.credit_limit)
        setIsModalOpen(true)
    }

    const viewHistory = (customerId) => {
        api.get(`/customers/${customerId}`)
            .then(res => {
                setCustomerHistory(res.data)
                setIsHistoryModalOpen(true)
            })
            .catch(err => alert("Failed to fetch customer history"))
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer? This will only work if they have no sales history.")) return
        try {
            await api.delete(`/customers/${id}`)
            fetchCustomers()
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete customer")
        }
    }

    const onSubmit = async (data) => {
        try {
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer.id}`, data)
            } else {
                await api.post('/customers', data)
            }
            setIsModalOpen(false)
            fetchCustomers()
        } catch (err) {
            console.error(err)
            alert("Operation failed")
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery))
    )

    if (loading && customers.length === 0) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading customers...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
                    <p className="text-slate-500 text-sm">Manage your client base and track their purchase history</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-teal-600/20"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>New Customer</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500 focus:border-teal-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Customer List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                                <UserGroupIcon className="h-6 w-6" />
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${customer.type === 'wholesale' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                {customer.type}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-1">{customer.name}</h3>
                        <div className="space-y-2 text-sm text-slate-500">
                            <div className="flex items-center space-x-2">
                                <PhoneIcon className="h-4 w-4" />
                                <span>{customer.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CreditCardIcon className="h-4 w-4" />
                                <span>Credit Limit: KSh {parseFloat(customer.credit_limit).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <TagIcon className="h-4 w-4" />
                                <span>{customer.sales_count || 0} total orders</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => viewHistory(customer.id)}
                                className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                            >
                                <EyeIcon className="h-4 w-4" />
                                <span>History</span>
                            </button>
                            <div className="flex space-x-2">
                                <button onClick={() => openEditModal(customer)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <PencilIcon className="h-4.5 w-4.5" />
                                </button>
                                <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <TrashIcon className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCustomers.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
                    No customers found matching your search.
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? "Edit Customer" : "Add New Customer"}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input {...register("name", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" placeholder="e.g. John Doe / Company Ltd" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Type</label>
                            <select {...register("type", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border">
                                <option value="retail">Retail</option>
                                <option value="wholesale">Wholesale</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <input {...register("phone")} className="w-full border-slate-300 rounded-lg p-2 border" placeholder="07..." />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit (KSh)</label>
                        <input type="number" step="0.01" {...register("credit_limit")} className="w-full border-slate-300 rounded-lg p-2 border" />
                        <p className="text-[10px] text-slate-400 mt-1">Maximum allowed credit for partial/credit payments</p>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20">
                            {editingCustomer ? 'Save Changes' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* History Modal */}
            {isHistoryModalOpen && customerHistory && (
                <Modal
                    isOpen={true}
                    onClose={() => setIsHistoryModalOpen(false)}
                    title={`Order History: ${customerHistory.name}`}
                    className="max-w-4xl"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <span className="block text-xs text-slate-500 uppercase font-bold">Total Invoices</span>
                                <span className="text-2xl font-bold text-slate-800">{customerHistory.sales.length}</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <span className="block text-xs text-slate-500 uppercase font-bold">Total Value</span>
                                <span className="text-2xl font-bold text-teal-700">
                                    KSh {customerHistory.sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <span className="block text-xs text-slate-500 uppercase font-bold">Credit Limit</span>
                                <span className="text-2xl font-bold text-slate-800">KSh {parseFloat(customerHistory.credit_limit).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-4 py-3">Invoice</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Products</th>
                                        <th className="px-4 py-3">Payment</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customerHistory.sales.map(sale => (
                                        <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs">{sale.invoice_no}</td>
                                            <td className="px-4 py-3 text-sm">{new Date(sale.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {sale.items.map((it, idx) => (
                                                        <span key={idx} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                                            {it.product?.name} (x{it.qty})
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sale.payment_status === 'paid' ? 'bg-green-50 text-green-600' :
                                                        sale.payment_status === 'partial' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                    {sale.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-700">KSh {parseFloat(sale.total_amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {customerHistory.sales.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-12 text-center text-slate-400">No sales records for this customer yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
