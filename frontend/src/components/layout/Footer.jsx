import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Motion = motion;

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Motion.footer 
      className="border-t border-cyan-300/20 bg-linear-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated gradient background */}
      <Motion.div
        className="absolute inset-0 opacity-0 bg-linear-to-r from-cyan-500/10 via-transparent to-cyan-500/10"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Logo & Branding with Hover Animation */}
          <Motion.div 
            className="flex flex-col gap-4 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/" className="inline-flex items-center gap-2 w-fit group">
              <Motion.img
                src="/caresync.png"
                alt="CareSyncr"
                className="h-8 w-8 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                animate={{ rotate: [0, 10, -10, 0] }}
                whileHover={{ rotate: 0, scale: 1.1 }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <Motion.span 
                className="text-lg font-semibold bg-linear-to-r from-cyan-300 to-cyan-200 bg-clip-text text-transparent"
                whileHover={{ backgroundImage: 'linear-gradient(to right, #06b6d4, #22d3ee, #06b6d4)' }}
              >
                CareSyncr
              </Motion.span>
            </Link>
            <p className="text-sm text-slate-400">A comprehensive healthcare management platform bringing harmony to patient care and clinical workflows.</p>
          </Motion.div>

          {/* Made with Love - Enhanced Animation */}
          <Motion.div 
            className="flex flex-col gap-3 items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 text-slate-300 group relative">
              <span className="text-sm group-hover:text-cyan-200 transition duration-300">Made with</span>
              <Motion.div
                className="relative"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 15, -15, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.3 }}
              >
                <Heart 
                  size={16} 
                  className="text-red-400 fill-red-400" 
                />
                <Motion.div
                  className="absolute inset-0 rounded-full bg-red-400/30 blur-md"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </Motion.div>
              <span className="text-sm group-hover:text-cyan-200 transition duration-300">by Vasu</span>
            </div>
            <Motion.div
              className="text-xs text-slate-400 text-center"
              animate={{ opacity: [0.6, 1, 0.6], y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Building healthcare with passion and precision ✨
            </Motion.div>
          </Motion.div>

          {/* Legal Section with Hover Effects */}
          <Motion.div 
            className="flex flex-col gap-3 items-end md:items-left"
            whileHover={{ x: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Motion.div className="text-right md:text-left">
              <Motion.p 
                className="text-sm font-medium text-slate-100"
                whileHover={{ color: '#06b6d4' }}
              >
                © {currentYear} CareSyncr
              </Motion.p>
              <p className="text-xs text-slate-500 mt-1">All rights reserved</p>
            </Motion.div>
            <div className="flex gap-4 text-xs text-slate-400">
              <Motion.a 
                href="#privacy" 
                className="hover:text-cyan-300 transition relative group"
                whileHover={{ color: '#06b6d4' }}
              >
                Privacy Policy
                <Motion.div 
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400"
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </Motion.a>
              <Motion.a 
                href="#terms" 
                className="hover:text-cyan-300 transition relative group"
                whileHover={{ color: '#06b6d4' }}
              >
                T&C
                <Motion.div 
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400"
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </Motion.a>
            </div>
          </Motion.div>
        </div>

        {/* Bottom line with animated gradient */}
        <Motion.div 
          className="mt-8 border-t border-cyan-300/10 pt-6 text-center relative"
          whileHover={{ borderColor: 'rgba(34, 211, 238, 0.4)' }}
        >
          <p className="text-xs text-slate-500">CareSyncr © {currentYear} • Empowering Healthcare with Technology • India</p>
          <Motion.div
            className="absolute inset-x-0 -top-3 h-0.5 bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </Motion.div>
      </div>
    </Motion.footer>
  );
};
