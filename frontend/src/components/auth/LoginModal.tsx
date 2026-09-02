import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';
import { Command, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import './LoginModal.css';

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const onSubmit = async (data: LoginFormValues) => {
    setServerError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, data);
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/');
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 401) {
          setServerError("Invalid email or password");
        } else if (err.response.status === 403) {
          setServerError("This account has been deactivated. Contact your administrator.");
        } else {
          setServerError("An unexpected error occurred. Please try again.");
        }
      } else {
        setServerError("Can't reach the server. Please try again.");
      }
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 1000);
    }
  };

  const formVariants: import('framer-motion').Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 }
    },
    exit: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 as const }
    }
  };

  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const shakeAnimation = { x: [-3, 3, -2, 2, 0] };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
        aria-label="Close modal"
      />

      <motion.div
        className="relative w-full max-w-4xl bg-ops-bg-surface rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
        initial={{ scale: 0.95, opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Ambient Color Detail (Right Panel drift) */}
        {!shouldReduceMotion && (
          <>
            <motion.div 
              className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-ops-primary opacity-5 rounded-full blur-[80px] pointer-events-none"
              animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute bottom-[-10%] right-[30%] w-64 h-64 bg-ops-warning opacity-5 rounded-full blur-[80px] pointer-events-none"
              animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        {/* Left Panel: Illustration */}
        <div className="hidden md:flex w-[45%] living-gradient relative overflow-hidden items-center justify-center">
          {!shouldReduceMotion && (
            <>
              {/* Orb 1: Amber */}
              <motion.div 
                className="absolute w-[80%] h-[80%] bg-yellow-400 rounded-full mix-blend-overlay filter blur-[70px] opacity-40"
                animate={{ x: ['-20%', '10%', '-20%'], y: ['-20%', '10%', '-20%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Orb 2: Pink */}
              <motion.div 
                className="absolute w-[70%] h-[70%] bg-pink-400 rounded-full mix-blend-overlay filter blur-[70px] opacity-30"
                animate={{ x: ['10%', '-15%', '10%'], y: ['10%', '-20%', '10%'] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Orb 3: Light Blue */}
              <motion.div 
                className="absolute w-[60%] h-[60%] bg-blue-400 rounded-full mix-blend-overlay filter blur-[60px] opacity-30"
                animate={{ x: ['-10%', '20%', '-10%'], y: ['20%', '-10%', '20%'] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}
          
          <div className="relative z-10 flex flex-col items-center justify-center text-white text-center p-8">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            >
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg border border-white/30"
                animate={shouldReduceMotion ? {} : { 
                  scale: [1, 1.03, 1],
                  boxShadow: ['0px 0px 0px rgba(255,255,255,0)', '0px 0px 20px rgba(255,255,255,0.2)', '0px 0px 0px rgba(255,255,255,0)']
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Command size={32} />
              </motion.div>
            </motion.div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">OpsDesk</h2>
            <p className="text-white/80 font-medium">The central portal for your operations.</p>
          </div>
        </div>

        {/* Right Panel: Form */}
        <motion.div 
          className="w-full md:w-[55%] p-8 sm:p-12 flex flex-col justify-center relative z-10"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          
          <motion.div variants={itemVariants} className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shrink-0">
              <Command size={20} />
            </div>
            <span className="font-bold text-xl text-black tracking-tight">OpsDesk</span>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-[32px] leading-tight font-bold text-ops-text-primary tracking-tight mb-2">
              Welcome Back!
            </h1>
            <p className="text-ops-text-secondary text-base">
              Enter your details below to sign in.
            </p>
          </motion.div>

          <AnimatePresence>
            {serverError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-ops-danger-bg border border-ops-danger/20 rounded-xl text-ops-danger text-sm font-medium"
              >
                {serverError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            
            {/* Email */}
            <motion.div variants={itemVariants} className="relative input-underline">
              <motion.div 
                animate={errors.email && !shouldReduceMotion ? shakeAnimation : {}} 
                transition={{ duration: 0.25 }}
              >
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className={`block w-full px-0 pt-5 pb-2 text-base text-ops-text-primary bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer transition-colors ${
                    errors.email ? 'border-ops-danger' : 'border-ops-border-strong'
                  }`}
                  placeholder=" "
                />
                <label 
                  htmlFor="email" 
                  className={`absolute text-sm duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] peer-focus:text-ops-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 ${
                    errors.email ? 'text-ops-danger' : 'text-ops-text-secondary'
                  }`}
                >
                  Email address
                </label>
              </motion.div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-ops-danger mt-1.5 absolute"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="relative pt-2 input-underline">
              <motion.div 
                animate={errors.password && !shouldReduceMotion ? shakeAnimation : {}} 
                transition={{ duration: 0.25 }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register('password')}
                  className={`block w-full px-0 pt-5 pb-2 pr-10 text-base text-ops-text-primary bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer transition-colors ${
                    errors.password ? 'border-ops-danger' : 'border-ops-border-strong'
                  }`}
                  placeholder=" "
                />
                <label 
                  htmlFor="password" 
                  className={`absolute text-sm duration-200 transform -translate-y-4 scale-75 top-6 z-10 origin-[0] peer-focus:text-ops-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 ${
                    errors.password ? 'text-ops-danger' : 'text-ops-text-secondary'
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute right-0 top-[22px] text-ops-text-muted hover:text-ops-text-primary transition-colors p-2"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showPassword ? 'eye-off' : 'eye'}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </motion.div>
                  </AnimatePresence>
                </button>
              </motion.div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-ops-danger mt-1.5 absolute"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Remember me & Forgot Password */}
            <motion.div variants={itemVariants} className="flex items-center justify-between pt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-ops-border-strong text-ops-primary focus:ring-ops-primary cursor-pointer accent-ops-primary"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-ops-text-secondary cursor-pointer">
                  Remember me
                </label>
              </div>
              <a 
                href="#" 
                onClick={(e) => e.preventDefault()}
                className="text-sm font-medium text-ops-primary hover:text-ops-primary-hover transition-colors"
              >
                Forgot password?
              </a>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={isSubmitting || isRateLimited}
                whileHover={!isSubmitting && !shouldReduceMotion ? { scale: 1.02 } : {}}
                className="w-full h-12 mt-2 flex items-center justify-center gap-2 bg-ops-primary hover:bg-ops-primary-hover active:bg-ops-primary text-white rounded-full text-base font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-ops-primary/20 btn-sheen relative"
              >
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center"
                    >
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Loader2 size={20} className="animate-spin" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.span 
                      key="text"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                      Log in
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </form>

          {/* Footer Text */}
          <motion.p variants={itemVariants} className="mt-8 text-sm text-ops-text-muted text-center">
            Need access? <a href="#" className="text-ops-text-secondary hover:text-ops-primary underline underline-offset-4 transition-colors" onClick={e => e.preventDefault()}>Contact your administrator</a>
          </motion.p>

          {import.meta.env.DEV && (
            <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-ops-border-default/50">
              <p className="text-[10px] text-ops-text-muted font-bold uppercase tracking-widest mb-3 text-center">Dev Login</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <motion.button 
                  type="button" 
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, boxShadow: '0 0 12px rgba(46, 90, 172, 0.4)' }}
                  onClick={() => { setValue('email', 'admin@example.com'); setValue('password', 'admin123'); }} 
                  className="text-xs font-medium px-3 py-1.5 bg-ops-bg-base border border-ops-border-strong rounded-full transition-colors text-ops-text-secondary hover:text-ops-primary hover:border-ops-primary"
                >
                  Admin
                </motion.button>
                <motion.button 
                  type="button" 
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, boxShadow: '0 0 12px rgba(23, 178, 106, 0.4)' }}
                  onClick={() => { setValue('email', 'sales@example.com'); setValue('password', 'sales123'); }} 
                  className="text-xs font-medium px-3 py-1.5 bg-ops-bg-base border border-ops-border-strong rounded-full transition-colors text-ops-text-secondary hover:text-ops-success hover:border-ops-success"
                >
                  Sales
                </motion.button>
                <motion.button 
                  type="button" 
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, boxShadow: '0 0 12px rgba(247, 144, 9, 0.4)' }}
                  onClick={() => { setValue('email', 'warehouse@example.com'); setValue('password', 'warehouse123'); }} 
                  className="text-xs font-medium px-3 py-1.5 bg-ops-bg-base border border-ops-border-strong rounded-full transition-colors text-ops-text-secondary hover:text-ops-warning hover:border-ops-warning"
                >
                  Warehouse
                </motion.button>
                <motion.button 
                  type="button" 
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)' }}
                  onClick={() => { setValue('email', 'accounts@example.com'); setValue('password', 'accounts123'); }} 
                  className="text-xs font-medium px-3 py-1.5 bg-ops-bg-base border border-ops-border-strong rounded-full transition-colors text-ops-text-secondary hover:text-purple-500 hover:border-purple-500"
                >
                  Accounts
                </motion.button>
              </div>
            </motion.div>
          )}

        </motion.div>
      </motion.div>
    </motion.div>
  );
}
