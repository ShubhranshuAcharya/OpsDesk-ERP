import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Globe } from 'lucide-react';
import { LoginModal } from '../components/auth/LoginModal';
import { QuietCurrent } from '../components/ui/QuietCurrent';
import { CloudBackground } from '../components/ui/CloudBackground';

// Set to false to revert to the original wave background
const USE_CLOUDS = true;

export default function Login() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ops-bg-base font-sans overflow-hidden relative">
      <motion.div
        className="w-full min-h-screen relative flex flex-col"
        animate={{
          scale: isModalOpen ? 0.97 : 1,
          filter: isModalOpen ? 'blur(6px)' : 'blur(0px)',
          opacity: isModalOpen ? 0.7 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Animated Background Flourish */}
        {USE_CLOUDS ? <CloudBackground /> : <QuietCurrent />}

        {/* Top Navigation */}
        <header className="relative z-10 w-full px-6 py-6 sm:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ops-text-primary flex items-center justify-center text-white shrink-0 shadow-sm">
              <Command size={20} />
            </div>
            <span className="font-bold text-xl text-ops-text-primary tracking-tight">OpsDesk</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center px-4 py-2 rounded-full bg-ops-text-primary text-white text-sm font-medium hover:bg-black transition-colors">
              Contact
            </button>
            <div className="flex items-center gap-2 text-ops-text-muted text-sm font-medium">
              <Globe size={16} />
              <span>EN / DE</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center mt-[-40px]">
          
          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-ops-text-secondary font-semibold uppercase tracking-widest text-xs sm:text-sm mb-4"
          >
            Streamline Your
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-[40px] sm:text-[56px] md:text-[72px] leading-[1.05] font-bold text-ops-text-primary tracking-tight max-w-[800px] mb-6"
          >
            Client Operations <br className="hidden sm:block" />
            <span className="text-ops-text-secondary">with powerful CRM</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="text-ops-text-secondary text-base sm:text-lg max-w-[500px] mb-10 leading-relaxed"
          >
            The all-in-one portal designed to centralize inventory, sales, and customer relations for your internal teams.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-ops-text-primary text-white rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started
          </motion.button>
        </main>



      </motion.div>

      {/* Login Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <LoginModal onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>
      
    </div>
  );
}
