import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaTooth, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

// Premium Holographic Tooth Scan SVG Illustration with Inline CSS Keyframes
const HolographicToothScan = () => (
  <svg
    viewBox="0 0 400 400"
    className="w-full max-w-[280px] md:max-w-[360px] filter drop-shadow-2xl"
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>{`
      @keyframes spin-clockwise {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes spin-counter {
        from { transform: rotate(0deg); }
        to { transform: rotate(-360deg); }
      }
      @keyframes laser-scan {
        0%, 100% { transform: translateY(100px); opacity: 0.1; }
        50% { transform: translateY(280px); opacity: 0.9; }
      }
      @keyframes blink-light {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
      @keyframes tooth-pulse {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.2)); }
        50% { transform: scale(1.03); filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.5)); }
      }
      .anim-spin-cw {
        animation: spin-clockwise 15s linear infinite;
        transform-origin: 200px 200px;
      }
      .anim-spin-ccw {
        animation: spin-counter 10s linear infinite;
        transform-origin: 200px 200px;
      }
      .anim-laser {
        animation: laser-scan 4s ease-in-out infinite;
      }
      .anim-blink {
        animation: blink-light 1.5s ease-in-out infinite;
      }
      .anim-tooth {
        animation: tooth-pulse 4s ease-in-out infinite;
        transform-origin: 200px 200px;
      }
    `}</style>

    <defs>
      {/* Glow Aura */}
      <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
      </radialGradient>
      
      {/* Tooth Body Gradient */}
      <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#f0f9ff" />
        <stop offset="100%" stopColor="#bae6fd" />
      </linearGradient>
      
      {/* Crown Highlight */}
      <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" opacity="0.85" />
        <stop offset="100%" stopColor="#ffffff" opacity="0" />
      </linearGradient>
      
      {/* Laser Line Gradient */}
      <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
        <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </linearGradient>
      
      {/* Tech box gradient */}
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#1e293b" stopOpacity="0.85" />
      </linearGradient>

      {/* Blue Cross Gradient */}
      <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    
    {/* Base Ambient Light */}
    <circle cx="200" cy="200" r="160" fill="url(#glowGrad)" />

    {/* Grid Scanner Interface */}
    <line x1="80" y1="200" x2="320" y2="200" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="200" y1="80" x2="200" y2="320" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
    
    <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" />
    <circle cx="200" cy="200" r="100" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" />

    {/* ROTATING HOLOGRAM RINGS */}
    <g className="anim-spin-cw">
      <ellipse cx="200" cy="200" rx="130" ry="40" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="18 10" opacity="0.65" />
      <circle cx="70" cy="200" r="4" fill="#22d3ee" />
      <circle cx="330" cy="200" r="4" fill="#22d3ee" />
    </g>

    <g className="anim-spin-ccw">
      <ellipse cx="200" cy="200" rx="115" ry="32" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.5" />
      <circle cx="200" cy="168" r="3" fill="#c084fc" />
      <circle cx="200" cy="232" r="3" fill="#c084fc" />
    </g>

    {/* Scanner target markings */}
    <path d="M 80,100 L 80,80 L 100,80" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="2" />
    <path d="M 300,80 L 320,80 L 320,100" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="2" />
    <path d="M 80,300 L 80,320 L 100,320" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="2" />
    <path d="M 300,320 L 320,320 L 320,300" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="2" />

    {/* TOOTH CHARACTER */}
    <g className="anim-tooth">
      <path
        d="M 150 120 
           C 175 120, 185 132, 200 132 
           C 215 132, 225 120, 250 120 
           C 285 120, 290 175, 280 220 
           C 272 250, 260 280, 245 280 
           C 230 280, 222 255, 200 225 
           C 178 255, 170 280, 155 280 
           C 140 280, 128 250, 120 220 
           C 110 175, 115 120, 150 120 Z"
        fill="url(#toothGrad)"
      />
      
      <path
        d="M 150 123 
           C 172 123, 182 135, 200 135 
           C 218 135, 228 123, 250 123 
           C 275 123, 278 155, 274 185 
           C 270 140, 240 132, 200 132 
           C 160 132, 130 140, 126 185
           C 122 155, 125 123, 150 123 Z"
        fill="url(#highlightGrad)"
      />
      
      {/* Eyes & Smile */}
      <circle cx="172" cy="180" r="7" fill="#0f172a" />
      <circle cx="170" cy="177" r="2.5" fill="white" />
      
      <circle cx="228" cy="180" r="7" fill="#0f172a" />
      <circle cx="226" cy="177" r="2.5" fill="white" />

      <circle cx="157" cy="190" r="6" fill="#f43f5e" opacity="0.45" />
      <circle cx="243" cy="190" r="6" fill="#f43f5e" opacity="0.45" />
      
      <path
        d="M 193 194 Q 200 203 207 194"
        stroke="#0f172a"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      
      <path d="M 255 145 Q 255 152 262 152 Q 255 152 255 159 Q 255 152 248 152 Q 255 152 255 145 Z" fill="#ffffff" />
    </g>

    {/* LASER SCANNING BAR */}
    <g className="anim-laser">
      <rect x="90" y="0" width="220" height="4" fill="url(#laserGrad)" filter="url(#neonGlow)" />
      <circle cx="90" cy="2" r="2.5" fill="#22d3ee" />
      <circle cx="310" cy="2" r="2.5" fill="#22d3ee" />
    </g>

    {/* HUD WIDGETS */}
    <g transform="translate(250, 70)">
      <rect x="0" y="0" width="110" height="45" rx="8" fill="url(#boxGrad)" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
      <text x="10" y="16" fill="#22d3ee" fontSize="9" fontFamily="monospace" fontWeight="bold">TOOTH SCAN</text>
      <text x="10" y="28" fill="white" fontSize="8" fontFamily="monospace">DENSITY: 98%</text>
      <text x="10" y="38" fill="white" fontSize="8" fontFamily="monospace">STATUS: ACTIVE</text>
      <circle cx="95" cy="13" r="3" fill="#10b981" className="anim-blink" />
    </g>

    <g transform="translate(40, 275)">
      <rect x="0" y="0" width="115" height="45" rx="8" fill="url(#boxGrad)" stroke="rgba(192, 132, 252, 0.3)" strokeWidth="1" />
      <text x="10" y="16" fill="#c084fc" fontSize="9" fontFamily="monospace" fontWeight="bold">DIAGNOSTICS</text>
      <text x="10" y="28" fill="white" fontSize="8" fontFamily="monospace">ENAMEL: EXCELLENT</text>
      <text x="10" y="38" fill="white" fontSize="8" fontFamily="monospace">HEALTH: STABLE</text>
    </g>

    {/* Plus signs */}
    <g transform="translate(75, 120) scale(0.6)">
      <path d="M -5 -15 L 5 -15 L 5 -5 L 15 -5 L 15 5 L 5 5 L 5 15 L -5 15 L -5 5 L -15 5 L -15 -5 L -5 -5 Z" fill="url(#crossGrad)" opacity="0.65" />
    </g>
    <g transform="translate(325, 248) scale(0.5)">
      <path d="M -5 -15 L 5 -15 L 5 -5 L 15 -5 L 15 5 L 5 5 L 5 15 L -5 15 L -5 5 L -15 5 L -15 -5 L -5 -5 Z" fill="url(#crossGrad)" opacity="0.45" />
    </g>
  </svg>
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password, data.remember);
      toast.success('🎉 Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background - Exact original gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-4xl px-4 my-8"
      >
        {/* Main Card */}
        <div 
          className="flex flex-col md:flex-row shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-800/80 backdrop-blur-md"
          style={{ backgroundColor: '#0b0f19' }}
        >
          
          {/* Left Panel: Login Form (Dark theme layout) */}
          <div 
            className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative"
            style={{ backgroundColor: '#0b0f19' }}
          >
            {/* Brand Logo and Title */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <FaTooth className="text-white text-base" />
              </div>
              <span className="text-lg font-bold text-white tracking-wide">Denti-Choice</span>
            </div>
            
            {/* Form Headers */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Welcome to Denti-Choice's hub
              </h1>
              <p className="text-sm text-slate-400 mt-2 font-medium">Sign into your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2">
                  Email or Username
                </label>
                <div 
                  className="relative rounded-2xl border border-slate-800 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden"
                  style={{ backgroundColor: '#131926' }}
                >
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white outline-none text-sm font-medium placeholder-slate-600 border-none shadow-none focus:ring-0 focus:border-none focus:outline-none"
                    placeholder="Enter Email Address"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                    Password
                  </label>
                </div>
                <div 
                  className="relative rounded-2xl border border-slate-800 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden"
                  style={{ backgroundColor: '#131926' }}
                >
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required' })}
                    className="w-full pl-11 pr-11 py-3.5 bg-transparent text-white outline-none text-sm font-medium placeholder-slate-600 border-none shadow-none focus:ring-0 focus:border-none focus:outline-none"
                    placeholder="Enter Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 z-10 cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password.message}</p>}
              </div>

              {/* Remember me */}
              <div className="flex items-center text-sm">
                <label className="flex items-center gap-2.5 text-slate-400 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('remember')}
                    className="w-4 h-4 rounded border-slate-700 bg-[#131926] text-blue-600 focus:ring-blue-500/40 focus:ring-offset-0"
                  />
                  Remember Me
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Logging In...' : 'Log in'}
              </button>
            </form>

            {/* Back to Homepage Button */}
            <button
              onClick={() => navigate('/')}
              className="mt-4 w-full py-3.5 rounded-2xl border border-slate-800 text-slate-400 font-semibold text-sm hover:bg-slate-800/30 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaArrowLeft className="text-xs" /> Back to Home Page
            </button>
          </div>

          {/* Right Panel: Vibrant Gradient + Holographic Tooth Scanner SVG */}
          <div 
            className="hidden md:flex md:w-1/2 flex-col justify-center items-center p-12 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #9333ea 100%)' }}
          >
            {/* Ambient background particles */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full flex justify-center"
              >
                <HolographicToothScan />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-8"
              >
                <h3 className="text-xl font-bold tracking-wide">
                  Your Smile Needs Our Care
                </h3>
                <p className="text-indigo-100/80 text-xs mt-3 max-w-sm font-medium leading-relaxed">
                  Empowering dental experts with smart tools and clinical records to keep every smile healthy and bright.
                </p>
              </motion.div>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
