import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

const EnvelopeAnimation = ({ onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
      <div className="relative w-32 h-32">
        {/* Envelope */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-white rounded-lg shadow-lg"
        >
          {/* Envelope flap */}
          <motion.div
            initial={{ rotateX: 0 }}
            animate={{ rotateX: 180 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-emerald-500 origin-top"
          />
          
          {/* Money icon */}
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Mail className="w-12 h-12 text-emerald-600" />
          </motion.div>
        </motion.div>

        {/* Success checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.5 }}
          className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
};

export default EnvelopeAnimation; 