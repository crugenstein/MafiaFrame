import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function TargetSelectionModal({ show, onHide, targets, selectedTarget, setSelectedTarget, desc, onConfirm }) {
    return (
      <AnimatePresence>
        {show && <motion.div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
        initial={{ opacity: 0}}
        animate={{ opacity: 1}}
        exit={{ opacity: 0}}
        >
          <motion.div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow w-80 max-w-full mx-4 p-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center border-b border-white/15 py-2">
              <h3 className="text-xl font-semibold text-gray-800">Select Target</h3>
              <button className="text-gray-600" onClick={onHide}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="wrap-anywhere text-pretty px-3 py-2 mb-2">{desc}</div>
            <div className="max-h-60 overflow-y-auto mb-1 no-scrollbar">
              <ul className='space-y-2'>
                {targets.map((target) => (
                  <li
                    key={target}
                    className={`w-full rounded-xl px-3 py-2 shadow cursor-pointer rounded-lg text-white hover:bg-indigo-600 transition-all ${selectedTarget === target ? 'bg-indigo-500 text-white' : 'bg-white/15'}`}
                    onClick={() => setSelectedTarget(target)}
                  >
                    {target}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center items-center">
              <button
                className={`px-4 py-2 rounded hover:from-blue-700 hover:to-indigo-800 transition text-white font-semibold shadow ${selectedTarget ? 'bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                onClick={() => onConfirm()}
                disabled={!selectedTarget}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
        }
      </AnimatePresence>
  )
}