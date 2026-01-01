
import React from 'react'
import { FolderIcon, FolderOpenIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isYesterday, parseISO } from 'date-fns'

export const DayFolder = ({ date, sales, totalAmount, isOpen, onToggle, children }) => {
    // Format label (e.g., "Today", "Yesterday", "Dec 25, 2025")
    const dateObj = parseISO(date)
    let label = format(dateObj, 'MMMM d, yyyy')
    if (isToday(dateObj)) label = "Today"
    if (isYesterday(dateObj)) label = "Yesterday"

    return (
        <div className="mb-4">
            <motion.div
                onClick={onToggle}
                whileHover={{ scale: 1.01 }}
                className={`
                    cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between
                    ${isOpen
                        ? 'bg-teal-50 border-teal-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm'
                    }
                `}
            >
                <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${isOpen ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                        {isOpen ? <FolderOpenIcon className="h-8 w-8" /> : <FolderIcon className="h-8 w-8" />}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${isOpen ? 'text-teal-900' : 'text-slate-700'}`}>
                            {label}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                            {sales.length} Orders
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider">Total Sales</span>
                    <span className="text-xl font-bold text-slate-800">KSh {totalAmount.toLocaleString()}</span>
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="border-l-2 border-teal-100 ml-8 pl-8 pt-4 pb-2 space-y-3">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
