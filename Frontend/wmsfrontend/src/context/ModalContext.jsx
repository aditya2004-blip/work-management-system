import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
} from 'react';

// Create context for modal state management
const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
    const [modalType, setModalType] = useState(null);
    const [modalProps, setModalProps] = useState({});

    // Open modal with type and optional props
    const openModal = useCallback((type, props = {}) => {
        setModalType(type);
        setModalProps(props);
    }, []);

    // Close modal and reset state
    const closeModal = useCallback(() => {
        setModalType(null);
        setModalProps({});
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo(
        () => ({
            modalType,
            modalProps,
            openModal,
            closeModal,
            isOpen: !!modalType
        }),
        [modalType, modalProps, openModal, closeModal]
    );

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

// Custom hook to access modal context
export const useModal = () => {
    const ctx = useContext(ModalContext);

    // Ensure hook is used within provider
    if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');

    return ctx;
};