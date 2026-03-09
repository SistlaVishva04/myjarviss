import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Linkedin } from "lucide-react";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreditsModal = ({ isOpen, onClose }: CreditsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container - True center using flexbox */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="glass-strong hud-corners rounded-lg p-6 relative overflow-hidden">
                {/* Hologram scanlines effect */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10" />
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        hsl(var(--primary) / 0.05) 2px,
                        hsl(var(--primary) / 0.05) 4px
                      )`
                    }}
                  />
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="relative z-10 text-center">
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                  >
                    <p className="font-rajdhani text-xs tracking-[0.3em] text-muted-foreground uppercase mb-2">
                      Designed & Developed By
                    </p>
                    <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-primary text-glow tracking-wider">
                      VAMSI SISTLA
                    </h2>
                  </motion.div>

                  {/* Divider */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mb-6"
                  />

                  {/* Links */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Email */}
                    <a
                      href="mailto:vishvasistla04@gmail.com"
                      className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all group"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-rajdhani text-xs sm:text-sm text-foreground/90 break-all">
                        vishvasistla04@gmail.com
                      </span>
                    </a>

                    {/* LinkedIn */}
                    <a
                      href="https://linkedin.com/in/vamsi-sistla"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all group"
                    >
                      <Linkedin className="h-4 w-4 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-rajdhani text-xs sm:text-sm text-foreground/90 break-all">
                        linkedin.com/in/vamsi-sistla
                      </span>
                    </a>
                  </motion.div>
                </div>

                {/* Corner accents */}
                <div className="absolute top-0 right-0 w-8 h-8">
                  <div className="absolute top-1 right-1 w-4 h-px bg-primary/50" />
                  <div className="absolute top-1 right-1 w-px h-4 bg-primary/50" />
                </div>
                <div className="absolute bottom-0 left-0 w-8 h-8">
                  <div className="absolute bottom-1 left-1 w-4 h-px bg-primary/50" />
                  <div className="absolute bottom-1 left-1 w-px h-4 bg-primary/50" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreditsModal;
