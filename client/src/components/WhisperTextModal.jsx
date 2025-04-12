import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function WhisperTextModal({ show, onHide, whisperContents, setWhisperContents, onConfirm, name }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow w-110 max-w-140 max-w-full mx-4 p-4"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex justify-between items-center border-b border-white/15 py-2">
                            <h3 className="text-xl font-semibold text-white">Whisper to {name}</h3>
                            <button className="text-gray-400 hover:text-white transition" onClick={onHide}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="py-3">
                            <textarea
                                rows={4}
                                value={whisperContents}
                                onChange={(e) => setWhisperContents(e.target.value)}
                                className="w-full rounded px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-blue-700 no-scrollbar"
                                placeholder="Type a whisper..."
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <div className="flex justify-center items-center">
                            <button
                                className={`px-4 py-2 rounded hover:from-blue-700 hover:to-indigo-800 transition text-white font-semibold shadow ${
                                    whisperContents ? 'bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700' : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                onClick={onConfirm}
                                disabled={!whisperContents}
                            >
                                Send
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
