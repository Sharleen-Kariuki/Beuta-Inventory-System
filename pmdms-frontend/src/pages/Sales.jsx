
import React, { useState, useEffect } from 'react'
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline'
import api from '../lib/axios'
import Modal from '../components/Modal'
import { useForm, useFieldArray } from 'react-hook-form'
import { DayFolder } from '../components/reactbits/DayFolder'

export default function SalesView() {
    const [groupedSales, setGroupedSales] = useState({})
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewSale, setViewSale] = useState(null)
    const [formData, setFormData] = useState({ customers: [], products: [] })
    const [openFolder, setOpenFolder] = useState(null)

    // React Hook Form for Create Sale
    const { register, control, handleSubmit, watch, setValue, reset } = useForm({
        defaultValues: {
            items: [{ product_id: "", qty: 1 }],
            installments: []
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const { fields: instFields, append: appendInst, remove: removeInst, replace: replaceInsts } = useFieldArray({
        control,
        name: "installments"
    });

    const fetchSales = () => {
        api.get('/sales')
            .then(res => {
                setGroupedSales(res.data)
                // Auto-open today's folder if it exists
                const today = new Date().toISOString().split('T')[0]
                if (res.data[today]) setOpenFolder(today)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }

    const fetchFormData = () => {
        api.get('/sales/form-data').then(res => setFormData(res.data))
    }

    useEffect(() => {
        fetchSales()
        fetchFormData()
    }, [])

    const openCreateModal = () => {
        reset({ items: [{ product_id: "", qty: 1 }], installments: [] })
        setIsModalOpen(true)
    }

    const autoGenerateInstallments = () => {
        const count = parseInt(watch("num_installments") || 1);
        const total = calculateTotal();
        if (total <= 0) return;

        const amt = (total / count).toFixed(2);
        const newInsts = [];
        for (let i = 1; i <= count; i++) {
            const d = new Date();
            d.setDate(d.getDate() + (i * 30));
            newInsts.push({
                amount: amt,
                due_date: d.toISOString().split('T')[0]
            });
        }
        replaceInsts(newInsts);
    }

    const onSubmit = async (data) => {
        try {
            await api.post('/sales', data)
            setIsModalOpen(false)
            fetchSales()
            alert("Sale created successfully!")
        } catch (err) {
            console.error(err)
            alert(err.response?.data?.message || "Failed to create sale")
        }
    }

    // Watch items to calculate total
    const watchedItems = watch("items")
    const calculateTotal = () => {
        return watchedItems.reduce((acc, item) => {
            const product = formData.products.find(p => p.id == item.product_id)
            return acc + (product ? product.selling_price * item.qty : 0)
        }, 0)
    }

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading sales...</div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Sales Orders</h2>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-teal-600/20"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>New Order</span>
                </button>
            </div>

            {/* Folder List */}
            <div className="space-y-2">
                {Object.keys(groupedSales).map(date => {
                    const sales = groupedSales[date]
                    const totalDayAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)

                    return (
                        <DayFolder
                            key={date}
                            date={date}
                            sales={sales}
                            totalAmount={totalDayAmount}
                            isOpen={openFolder === date}
                            onToggle={() => setOpenFolder(openFolder === date ? null : date)}
                        >
                            {/* Inside the folder: List of orders */}
                            {sales.map(sale => (
                                <div key={sale.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group mb-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 font-bold text-xs">
                                            INV
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{sale.customer?.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono">#{sale.invoice_no}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <span className="block font-bold text-slate-700">KSh {parseFloat(sale.total_amount).toLocaleString()}</span>
                                            <span className="text-xs text-slate-400 capitalize">{sale.payment_method.replace('_', ' ')}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setViewSale(sale); }}
                                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                                        >
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </DayFolder>
                    )
                })}

                {Object.keys(groupedSales).length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        No sales records found.
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="New Sales Invoice"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                        <select {...register("customer_id", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border focus:ring-teal-500">
                            <option value="">Select Customer</option>
                            {formData.customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Items</label>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex space-x-2 items-center">
                                    <select {...register(`items.${index}.product_id`, { required: true })} className="flex-1 border-slate-300 rounded-lg p-2 border text-sm">
                                        <option value="">Product</option>
                                        {formData.products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (KSh {p.selling_price})</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        {...register(`items.${index}.qty`, { required: true, min: 1 })}
                                        className="w-20 border-slate-300 rounded-lg p-2 border text-sm"
                                        placeholder="Qty"
                                    />
                                    <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => append({ product_id: "", qty: 1 })} className="mt-2 text-sm text-teal-600 font-medium hover:underline">
                            + Add Item
                        </button>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                        <span className="font-semibold text-slate-700">Total Amount:</span>
                        <span className="text-xl font-bold text-teal-700">KSh {calculateTotal().toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                            <select {...register("payment_method", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border">
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
                            <select {...register("payment_status", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border">
                                <option value="paid">Fully Paid</option>
                                <option value="credit">On Credit</option>
                                <option value="partial">Partial Payment</option>
                            </select>
                        </div>
                    </div>

                    {(watch("payment_status") === "credit" || watch("payment_status") === "partial") && (
                        <div className="space-y-4 border-t border-slate-100 pt-4">
                            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Payment Schedule</h4>

                            <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-12 md:col-span-5">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Due Date (Final)</label>
                                    <input type="date" {...register("due_date", { required: true })} className="w-full border-slate-300 rounded-lg p-2 border text-sm" />
                                </div>
                                <div className="col-span-8 md:col-span-5">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Split into X installments</label>
                                    <input type="number" min="1" {...register("num_installments")} className="w-full border-slate-300 rounded-lg p-2 border text-sm" placeholder="e.g. 3" />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <button
                                        type="button"
                                        onClick={autoGenerateInstallments}
                                        className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        SPLIT
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {instFields.map((field, index) => (
                                    <div key={field.id} className="flex space-x-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <input
                                            type="date"
                                            {...register(`installments.${index}.due_date`, { required: true })}
                                            className="flex-1 border-slate-300 rounded p-1.5 text-xs"
                                        />
                                        <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded p-1.5 w-32">
                                            <span className="text-[10px] text-slate-400 font-bold">KSh</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register(`installments.${index}.amount`, { required: true })}
                                                className="w-full border-none focus:ring-0 p-0 text-xs text-right font-bold text-teal-700"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <button type="button" onClick={() => removeInst(index)} className="text-red-400 hover:text-red-600 px-1">&times;</button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center px-2">
                                <button
                                    type="button"
                                    onClick={() => appendInst({ amount: "", due_date: "" })}
                                    className="text-xs font-bold text-teal-600 hover:underline"
                                >
                                    + Add Custom Installment
                                </button>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Scheduled</span>
                                    <span className={`text-sm font-bold ${Math.abs((watch("installments") || []).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0) - calculateTotal()) < 0.1
                                        ? 'text-teal-600' : 'text-rose-500'
                                        }`}>
                                        KSh {(watch("installments") || []).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">
                            Create Invoice
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            {viewSale && (
                <Modal isOpen={true} onClose={() => setViewSale(null)} title={`Invoice #${viewSale.invoice_no}`}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-slate-500">Customer</span>
                                <span className="font-medium">{viewSale.customer?.name}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500">Date</span>
                                <span className="font-medium">{new Date(viewSale.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-2 text-left">Product</th>
                                    <th className="p-2 text-right">Qty</th>
                                    <th className="p-2 text-right">Price</th>
                                    <th className="p-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {viewSale.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-2">{item.product?.name}</td>
                                        <td className="p-2 text-right">{item.qty}</td>
                                        <td className="p-2 text-right">KSh {item.unit_price}</td>
                                        <td className="p-2 text-right font-medium">KSh {item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-slate-200">
                                <tr>
                                    <td colSpan="3" className="p-2 text-right font-bold">Total</td>
                                    <td className="p-2 text-right font-bold text-lg">KSh {parseFloat(viewSale.total_amount).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Modal>
            )}
        </div>
    )
}
