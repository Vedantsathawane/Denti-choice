import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTooth, FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block mb-8"
        >
          <FaTooth className="text-8xl text-primary/30" />
        </motion.div>

        <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Oops! The page you are looking for seems to have gone missing. It might have been moved or doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <FaHome /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
