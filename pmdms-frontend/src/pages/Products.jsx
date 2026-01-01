
import React, { useState, useEffect } from 'react'
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import api from '../lib/axios'
import Modal from '../components/Modal'
import { useForm } from 'react-hook-form'

export default function ProductsView() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    const { register, handleSubmit, reset, setValue } = useForm()

    const fetchProducts = () => {
        api.get('/inventory/products')
            .then(res => {
                setProducts(res.data)
                setLoading(false)
            })
            .catch(err => {
                console.error("Failed to fetch products", err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const openAddModal = () => {
        setEditingItem(null)
        reset({})
        setIsModalOpen(true)
    }

    const openEditModal = (item) => {
        setEditingItem(item)
        setValue('name', item.name)
        setValue('sku', item.sku)
        setValue('selling_price', item.selling_price)
        setValue('current_stock', item.current_stock)
        setValue('min_stock_level', item.min_stock_level)
        setIsModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return
        try {
            await api.delete(`/inventory/products/${id}`)
            fetchProducts()
        } catch (err) {
            alert("Failed to delete product")
        }
    }

    const onSubmit = async (data) => {
        try {
            if (editingItem) {
                await api.put(`/inventory/products/${editingItem.id}`, data)
            } else {
                await api.post('/inventory/products', data)
            }
            setIsModalOpen(false)
            fetchProducts()
        } catch (err) {
            console.error(err)
            alert("Operation failed")
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading products...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Products Management</h2>
                <button
                    onClick={openAddModal}
                    className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-slate-900/20"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Finished Good</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-700 text-sm">Product Name</th>
                                <th className="p-4 font-semibold text-slate-700 text-sm">SKU</th>
                                <th className="p-4 font-semibold text-slate-700 text-sm">Selling Price</th>
                                <th className="p-4 font-semibold text-slate-700 text-sm">Stock</th>
                                <th className="p-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4 text-slate-700 font-medium">{item.name}</td>
                                    <td className="p-4 text-slate-500 font-mono text-sm">{item.sku}</td>
                                    <td className="p-4 text-slate-600">KSh {parseFloat(item.selling_price).toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`font-bold ${item.current_stock < item.min_stock_level ? 'text-red-600' : 'text-slate-700'}`}>
                                            {item.current_stock}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(item)} className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded">
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Product" : "Add New Product"}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                        <input {...register("name", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                            <input {...register("sku", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                            <input type="number" step="0.01" {...register("selling_price", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                            <input type="number" step="0.01" {...register("current_stock", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock Level</label>
                            <input type="number" step="0.01" {...register("min_stock_level", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg">Save Product</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
