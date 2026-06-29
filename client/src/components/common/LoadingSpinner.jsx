import { motion } from 'framer-motion';
import { FaTooth } from 'react-icons/fa';

const LoadingSpinner = ({ fullPage = false, size = 'md' }) => {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="flex flex-col items-center gap-4"
        >
          <FaTooth className={`${sizes.lg} text-primary`} />
        </motion.div>
        <p className="absolute mt-24 text-gray-500 dark:text-gray-400 text-sm font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <FaTooth className={`${sizes[size]} text-primary`} />
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;
