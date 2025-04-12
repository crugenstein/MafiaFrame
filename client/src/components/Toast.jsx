import { useEffect} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Toast({ show, onHide, text }) {
    useEffect(() => {
        if (show) {
            const timeout = setTimeout(() => onHide(), 6000)
            return () => clearTimeout(timeout)
        }
    }, [show, onHide])

    return (
      <AnimatePresence>
        {show &&
          <motion.div className="fixed top-4 left-4/9 z-50 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-green-400 shadow rounded-lg w-80 max-w-full mx-4 p-2"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center py-2">
            <div className="wrap-anywhere text-pretty px-3 py-2">{text}</div>
              <button className="text-gray-600 px-2" onClick={onHide}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
  )
}