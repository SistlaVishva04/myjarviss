import { motion } from "framer-motion";

const BackgroundGrid = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 0%, hsl(222 47% 3%) 70%)",
        }}
      />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(hsl(187 100% 50% / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(187 100% 50% / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Hexagon pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, hsl(187 100% 50% / 0.2) 0%, transparent 2%)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Corner HUD elements */}
      <div className="absolute top-4 left-4 w-32 h-32">
        <div className="absolute top-0 left-0 w-16 h-px bg-gradient-to-r from-primary/50 to-transparent" />
        <div className="absolute top-0 left-0 w-px h-16 bg-gradient-to-b from-primary/50 to-transparent" />
        <motion.div 
          className="absolute top-2 left-2 font-orbitron text-[10px] text-primary/50 tracking-wider"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          SYS:ACTIVE
        </motion.div>
      </div>

      <div className="absolute top-4 right-4 w-32 h-32">
        <div className="absolute top-0 right-0 w-16 h-px bg-gradient-to-l from-primary/50 to-transparent" />
        <div className="absolute top-0 right-0 w-px h-16 bg-gradient-to-b from-primary/50 to-transparent" />
        <motion.div 
          className="absolute top-2 right-2 font-orbitron text-[10px] text-primary/50 tracking-wider text-right"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          v2.1.0
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-4 w-32 h-32">
        <div className="absolute bottom-0 left-0 w-16 h-px bg-gradient-to-r from-primary/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-px h-16 bg-gradient-to-t from-primary/50 to-transparent" />
      </div>

      <div className="absolute bottom-4 right-4 w-32 h-32">
        <div className="absolute bottom-0 right-0 w-16 h-px bg-gradient-to-l from-primary/50 to-transparent" />
        <div className="absolute bottom-0 right-0 w-px h-16 bg-gradient-to-t from-primary/50 to-transparent" />
      </div>

      {/* Scanline effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(transparent 50%, hsl(187 100% 50% / 0.02) 50%)",
          backgroundSize: "100% 4px",
        }}
        animate={{
          backgroundPosition: ["0 0", "0 4px"],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

export default BackgroundGrid;
