import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Mail, Linkedin } from "lucide-react";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreditsModal = ({ isOpen, onClose }: CreditsModalProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="credits-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          <button
            type="button"
            className="credits-backdrop"
            aria-label="Close credits"
            onClick={onClose}
          />
          <motion.section
            ref={dialogRef}
            className="credits-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credits-title"
            initial={{ y: shouldReduceMotion ? 0 : 8 }}
            animate={{ y: 0 }}
            exit={{ y: shouldReduceMotion ? 0 : 8 }}
            transition={transition}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="credits-close icon-control"
              aria-label="Close credits"
            >
              <X aria-hidden="true" size={18} />
            </button>
            <h2 id="credits-title" className="credits-title">About myVishva</h2>
            <p className="credits-subtitle">Designed and developed by</p>
            <p className="credits-name">Vamsi Sistla</p>
            <div className="credits-links">
              <a href="mailto:vishvasistla04@gmail.com" className="credits-link">
                <Mail aria-hidden="true" size={17} />
                <span>vishvasistla04@gmail.com</span>
              </a>
              <a
                href="https://linkedin.com/in/vamsi-sistla"
                target="_blank"
                rel="noopener noreferrer"
                className="credits-link"
              >
                <Linkedin aria-hidden="true" size={17} />
                <span>linkedin.com/in/vamsi-sistla</span>
              </a>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreditsModal;
