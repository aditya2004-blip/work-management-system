import { useEffect } from "react";
import { X } from "lucide-react";

// Modal width variants
const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {

    useEffect(() => {
        if (!isOpen) return;

        // Close modal on Escape key
        const handler = (e) => { if (e.key === 'Escape') onClose(); };

        document.addEventListener('keydown', handler);

        // Prevent background scrolling when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose])

    // Do not render if modal is closed
    if (!isOpen) return null;

    return (
        <div
            // Overlay (click to close)
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                // Modal container with size control
                className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full ${SIZE_CLASSES[size]}`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default Modal;