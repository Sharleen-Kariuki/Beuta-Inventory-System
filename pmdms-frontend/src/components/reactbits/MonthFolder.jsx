
import React from 'react'
import { FolderIcon, FolderOpenIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'

export const MonthFolder = ({ monthLabel, count, totalAmount, isOpen, onToggle, children }) => {
    return (
        <div className="mb-4">
            <motion.div
                onClick={onToggle}
                whileHover={{ scale: 1.005 }}
                className={`
                    cursor-pointer p-5 rounded-xl border transition-all flex items-center justify-between
                    ${isOpen
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                    }
                `}
            >
                <div className="flex items-center space-x-5">
                    <div className={`p-3 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        {isOpen ? <FolderOpenIcon className="h-10 w-10" /> : <FolderIcon className="h-10 w-10" />}
                    </div>
                    <div>
                        <h3 className={`font-bold text-xl ${isOpen ? 'text-blue-900' : 'text-slate-800'}`}>
                            {monthLabel}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium font-mono">
                            {count} Transactions
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Monthly Total</span>
                    <span className="text-2xl font-black text-slate-900">KSh {totalAmount.toLocaleString()}</span>
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-l-4 border-blue-100 ml-10 pl-10 pt-6 pb-2 space-y-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
