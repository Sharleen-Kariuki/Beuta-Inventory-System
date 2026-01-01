
import React, { useState, useEffect } from 'react'
import { PlusIcon, BeakerIcon, PlayIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import api from '../lib/axios'
import Modal from '../components/Modal'
import { useForm, useFieldArray } from 'react-hook-form'

export default function ProductionView() {
    const [activeTab, setActiveTab] = useState('run') // 'recipes', 'run', 'history'
    const [recipes, setRecipes] = useState([])
    const [runs, setRuns] = useState([])
    const [products, setProducts] = useState([])
    const [rawMaterials, setRawMaterials] = useState([])
    const [loading, setLoading] = useState(false)

    // Modals & State
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
    const [editingRecipeId, setEditingRecipeId] = useState(null)

    // Forms
    const { register: regRecipe, control: ctrlRecipe, handleSubmit: handleRecipeSubmit, reset: resetRecipe, setValue: setRecipeValue } = useForm({
        defaultValues: { base_quantity: 1, items: [{ raw_material_id: "", quantity_required: 0 }] }
    })
    const { fields: recipeFields, append: appendRecipeItem, remove: removeRecipeItem, replace: replaceRecipeItems } = useFieldArray({
        control: ctrlRecipe,
        name: "items"
    })

    const { register: regRun, handleSubmit: handleRunSubmit, reset: resetRun } = useForm()

    const fetchData = async () => {
        setLoading(true)
        try {
            const [resRecipes, resRuns, resProducts, resMats] = await Promise.all([
                api.get('/recipes'),
                api.get('/production-runs'),
                api.get('/inventory/products'),
                api.get('/inventory/raw-materials')
            ])
            setRecipes(resRecipes.data)
            setRuns(resRuns.data.data)
            setProducts(resProducts.data)
            setRawMaterials(resMats.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const openRecipeModal = (recipe = null) => {
        if (recipe) {
            setEditingRecipeId(recipe.id)
            setRecipeValue("product_id", recipe.product_id)
            setRecipeValue("base_quantity", recipe.base_quantity || 1)
            setRecipeValue("notes", recipe.notes)

            // Format items for the form
            const formattedItems = recipe.items.map(item => ({
                raw_material_id: item.raw_material_id,
                quantity_required: item.quantity_required
            }))
            replaceRecipeItems(formattedItems)
        } else {
            setEditingRecipeId(null)
            resetRecipe({ product_id: "", base_quantity: 1, notes: "", items: [{ raw_material_id: "", quantity_required: 0 }] })
        }
        setIsRecipeModalOpen(true)
    }

    const onSaveRecipe = async (data) => {
        try {
            if (editingRecipeId) {
                await api.put(`/recipes/${editingRecipeId}`, data)
                alert("Recipe updated!")
            } else {
                await api.post('/recipes', data)
                alert("Recipe created!")
            }
            setIsRecipeModalOpen(false)
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Failed")
        }
    }

    const onDeleteRecipe = async (id) => {
        if (!window.confirm("Are you sure you want to delete this recipe?")) return
        try {
            await api.delete(`/recipes/${id}`)
            fetchData()
        } catch (err) {
            alert("Failed to delete recipe")
        }
    }

    const onExecuteRun = async (data) => {
        if (!window.confirm(`Produces ${data.qty_to_produce} units. Stock will be deducted. Proceed?`)) return

        try {
            await api.post('/production-runs', data)
            fetchData()
            resetRun()
            alert("Production Run Successful! Inventory updated.")
        } catch (err) {
            alert(err.response?.data?.message || "Production Failed")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Production Management</h2>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
                {['run', 'recipes', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                            ? 'bg-white text-teal-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab === 'run' ? 'Production Run' : tab === 'recipes' ? 'Formulations' : 'History'}
                    </button>
                ))}
            </div>

            {/* CONTENT: PRODUCTION RUN */}
            {activeTab === 'run' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                            <PlayIcon className="h-5 w-5 mr-2 text-teal-500" />
                            Start New Batch
                        </h3>
                        <form onSubmit={handleRunSubmit(onExecuteRun)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Product</label>
                                <select {...regRun("product_id", { required: true })} className="w-full border-slate-300 rounded-lg p-2.5 border">
                                    <option value="">-- Choose Product --</option>
                                    {recipes.map(r => (
                                        <option key={r.id} value={r.product_id}>{r.product?.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Only products with active recipes are shown.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Produce</label>
                                <input type="number" step="1" {...regRun("qty_to_produce", { required: true })} className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="e.g. 100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Batch Code (Optional)</label>
                                <input {...regRun("batch_code")} className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="Auto-generated if empty" />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-600/20 transition-all">
                                Execute Production
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex flex-col justify-center items-center text-center">
                        <BeakerIcon className="h-12 w-12 text-slate-300 mb-4" />
                        <h4 className="font-medium text-slate-600">How it works</h4>
                        <p className="text-sm text-slate-500 mt-2 max-w-xs">
                            Select a product and quantity. The system will calculate required raw materials based on the recipe and deduct them from inventory automatically.
                        </p>
                    </div>
                </div>
            )}

            {/* CONTENT: RECIPES */}
            {activeTab === 'recipes' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => openRecipeModal()} className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">
                            <PlusIcon className="h-4 w-4" /> <span>Add Recipe</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{recipe.product?.name}</h4>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => openRecipeModal(recipe)} className="text-sm text-teal-600 hover:text-teal-800 font-medium">Edit</button>
                                        <button onClick={() => onDeleteRecipe(recipe.id)} className="text-sm text-red-400 hover:text-red-600 font-medium">Delete</button>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Ingredients (per unit)</h5>
                                    <ul className="space-y-1">
                                        {recipe.items.map(item => (
                                            <li key={item.id} className="text-sm flex justify-between">
                                                <span className="text-slate-700">{item.raw_material?.name}</span>
                                                <span className="font-mono text-slate-500">{item.quantity_required} {item.raw_material?.unit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTENT: HISTORY */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-slate-700">Batch Code</th>
                                <th className="p-4 text-sm font-semibold text-slate-700">Date</th>
                                <th className="p-4 text-sm font-semibold text-slate-700">Product</th>
                                <th className="p-4 text-sm font-semibold text-slate-700">Produced</th>
                                <th className="p-4 text-sm font-semibold text-slate-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {runs.map(run => (
                                <tr key={run.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-600 text-sm">{run.batch_code}</td>
                                    <td className="p-4 text-slate-500 text-sm">{new Date(run.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-slate-800">{run.product?.name}</td>
                                    <td className="p-4 font-bold text-slate-800">{run.qty_produced}</td>
                                    <td className="p-4">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">Completed</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CREATE/EDIT RECIPE MODAL */}
            <Modal isOpen={isRecipeModalOpen} onClose={() => setIsRecipeModalOpen(false)} title={editingRecipeId ? "Edit Formulation" : "New Product Formulation"}>
                <form onSubmit={handleRecipeSubmit(onSaveRecipe)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                        <select
                            {...regRecipe("product_id", { required: true })}
                            className="w-full border-slate-300 rounded-lg p-2 border disabled:bg-slate-100"
                            disabled={!!editingRecipeId}
                        >
                            <option value="">Select Finished Good</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {editingRecipeId && <p className="text-xs text-slate-400 mt-1">Product cannot be changed while editing.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Base Quantity (Yield)</label>
                        <div className="flex items-center space-x-2">
                            <input type="number" step="0.01" {...regRecipe("base_quantity", { required: true })} className="flex-1 border-slate-300 rounded-lg p-2 border" placeholder="e.g. 1.00" />
                            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Units Produced</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Specify how many units of product this ingredient list yields.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ingredients</label>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {recipeFields.map((field, index) => (
                                <div key={field.id} className="flex space-x-2">
                                    <select {...regRecipe(`items.${index}.raw_material_id`)} className="flex-1 border-slate-300 rounded border text-sm p-2">
                                        <option value="">Material</option>
                                        {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                                    </select>
                                    <input type="number" step="0.001" {...regRecipe(`items.${index}.quantity_required`)} className="w-24 border-slate-300 rounded border text-sm p-2" placeholder="Qty" />
                                    <button type="button" onClick={() => removeRecipeItem(index)} className="text-red-400">&times;</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => appendRecipeItem({ raw_material_id: "", quantity_required: 0 })} className="mt-2 text-sm text-teal-600">+ Add Ingredient</button>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsRecipeModalOpen(false)} className="px-4 py-2 text-slate-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg">Save Recipe</button>
                    </div>
                </form>
            </Modal>
        </div >
    )
}
