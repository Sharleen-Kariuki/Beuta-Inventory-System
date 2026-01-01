
import React, { useState, useEffect } from 'react'
import { PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon, ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline'
import api from '../lib/axios'
import Modal from '../components/Modal'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'

export default function InventoryView() {
    const [materials, setMaterials] = useState([])
    const [restockHistory, setRestockHistory] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('stock') // 'stock' or 'history'

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    // React Hook Form
    const { register, handleSubmit, reset, setValue } = useForm()
    const restockForm = useForm({
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            items: [{ raw_material_id: '', qty: '', unit_price: '' }]
        }
    })
    const { fields, append, remove } = useFieldArray({
        control: restockForm.control,
        name: "items"
    })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [materialsRes, historyRes, suppliersRes] = await Promise.all([
                api.get('/inventory/raw-materials'),
                api.get('/reports/restock'),
                api.get('/suppliers')
            ])
            setMaterials(materialsRes.data)
            setRestockHistory(historyRes.data)
            setSuppliers(suppliersRes.data)
        } catch (err) {
            console.error("Failed to fetch data", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const openAddModal = () => {
        setEditingItem(null)
        reset({})
        setIsModalOpen(true)
    }

    const openEditModal = (item) => {
        setEditingItem(item)
        // Set form values
        setValue('name', item.name)
        setValue('sku', item.sku)
        setValue('unit', item.unit)
        setValue('cost_price', item.cost_price)
        setValue('current_stock', item.current_stock)
        setValue('reorder_level', item.reorder_level)
        setIsModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return
        try {
            await api.delete(`/inventory/raw-materials/${id}`)
            fetchData() // Refresh
        } catch (err) {
            alert("Failed to delete item")
        }
    }

    const onSubmit = async (data) => {
        try {
            if (editingItem) {
                await api.put(`/inventory/raw-materials/${editingItem.id}`, data)
            } else {
                await api.post('/inventory/raw-materials', data)
            }
            setIsModalOpen(false)
            fetchData()
        } catch (err) {
            console.error(err)
            alert("Operation failed check console")
        }
    }

    const onSubmitRestock = async (data) => {
        try {
            await api.post('/inventory/restock', data)
            setIsRestockModalOpen(false)
            restockForm.reset()
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Restock failed")
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading inventory...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventory</h2>
                    <p className="text-slate-500 text-sm">Manage raw materials and track restocks</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsRestockModalOpen(true)}
                        className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-teal-600/20"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                        <span>Restock</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-slate-900/20"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Material</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`px-6 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'stock' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <ClipboardDocumentListIcon className="h-5 w-5" />
                        Current Stock
                    </div>
                    {activeTab === 'stock' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'history' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <TruckIcon className="h-5 w-5" />
                        Restock History
                    </div>
                    {activeTab === 'history' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'stock' ? (
                    <motion.div
                        key="stock-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-700 text-sm">Item Name</th>
                                        <th className="p-4 font-semibold text-slate-700 text-sm">SKU</th>
                                        <th className="p-4 font-semibold text-slate-700 text-sm">Stock</th>
                                        <th className="p-4 font-semibold text-slate-700 text-sm">Avg Cost</th>
                                        <th className="p-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {materials.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4 text-slate-700 font-medium">{item.name}</td>
                                            <td className="p-4 text-slate-500 font-mono text-sm">{item.sku}</td>
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`font-bold ${item.current_stock < item.reorder_level ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {item.current_stock.toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{item.unit}</span>
                                                    {item.current_stock < item.reorder_level && (
                                                        <span className="bg-red-100 text-red-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded animate-pulse">Low</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600">KSh {parseFloat(item.cost_price).toFixed(2)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                                                        <PencilIcon className="h-4.5 w-4.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <TrashIcon className="h-4.5 w-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="history-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-700 text-sm">Date</th>
                                        <th className="p-4 font-semibold text-slate-700 text-sm">Supplier</th>
                                        <th className="p-4 font-semibold text-slate-700 text-sm">Items Restocked</th>
                                        <th className="p-4 font-semibold text-slate-700 text-sm italic">Invoice</th>
                                        <th className="p-4 font-semibold text-slate-700 text-sm text-right">Total Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {restockHistory.map(record => (
                                        <tr key={record.id} className="hover:bg-slate-50">
                                            <td className="p-4 text-slate-600 text-sm">{new Date(record.date).toLocaleDateString()}</td>
                                            <td className="p-4 font-medium text-slate-800">{record.supplier?.name}</td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {record.items.map((it, idx) => (
                                                        <div key={idx} className="text-xs text-slate-500">
                                                            <span className="font-semibold text-slate-700">{it.raw_material?.name}</span>: {it.qty} {it.raw_material?.unit}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-400 text-xs font-mono">{record.invoice_no || 'N/A'}</td>
                                            <td className="p-4 text-right font-bold text-slate-900">KSh {parseFloat(record.total_amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {restockHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-slate-400">No restock records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CRUD Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Edit Material" : "Add New Material"}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input {...register("name", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. Titanium Dioxide" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                            <input {...register("sku", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500 focus:border-teal-500" placeholder="RM-001" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                            <select {...register("unit", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500 focus:border-teal-500">
                                <option value="kg">kg</option>
                                <option value="liter">liter</option>
                                <option value="pcs">pcs</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label>
                            <input type="number" step="0.01" {...register("cost_price", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500 focus:border-teal-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                            <input type="number" step="0.01" {...register("current_stock", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500 focus:border-teal-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Re-order Level</label>
                        <input type="number" step="0.01" {...register("reorder_level", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500 focus:border-teal-500" />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">
                            {editingItem ? 'Save Changes' : 'Create Material'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Restock Modal */}
            <Modal
                isOpen={isRestockModalOpen}
                onClose={() => setIsRestockModalOpen(false)}
                title="Record Material Restock"
            >
                <form onSubmit={restockForm.handleSubmit(onSubmitRestock)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                            <select {...restockForm.register("supplier_id", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border">
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input type="date" {...restockForm.register("date", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Invoice No (Optional)</label>
                        <input {...restockForm.register("invoice_no")} className="w-full border-slate-300 rounded-lg p-2 border" placeholder="INV-2023-001" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Materials received</label>
                            <button type="button" onClick={() => append({ raw_material_id: '', qty: '', unit_price: '' })} className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                                <PlusIcon className="h-4 w-4" /> Add Item
                            </button>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
                                <div className="col-span-12 md:col-span-5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Material</label>
                                    <select {...restockForm.register(`items.${index}.raw_material_id`, { required: true })} className="w-full border-slate-300 rounded p-1.5 text-sm">
                                        <option value="">Select Material</option>
                                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                                    <input type="number" step="0.01" {...restockForm.register(`items.${index}.qty`, { required: true })} className="w-full border-slate-300 rounded p-1.5 text-sm" placeholder="Qty" />
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price</label>
                                    <input type="number" step="0.01" {...restockForm.register(`items.${index}.unit_price`, { required: true })} className="w-full border-slate-300 rounded p-1.5 text-sm" placeholder="Cost" />
                                </div>
                                <div className="col-span-12 md:col-span-1 text-center">
                                    <button type="button" onClick={() => remove(index)} className="p-1 text-slate-300 hover:text-red-500">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100">
                        <button type="button" onClick={() => setIsRestockModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 shadow-lg shadow-teal-600/20">
                            Confirm Restock
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
