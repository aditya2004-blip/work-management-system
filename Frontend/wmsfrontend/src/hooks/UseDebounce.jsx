import { useState, useEffect } from 'react';

// Custom hook: delays updating a value until after a specified delay
const useDebounce = (value, delay = 300) => {
    // State to store the debounced value
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set a timer to update debounced value after delay
        const timer = setTimeout(() => setDebouncedValue(value), delay);

        // Cleanup function:
        // Clears previous timer if value changes before delay ends
        return () => clearTimeout(timer);

    }, [value, delay]); // Runs whenever value or delay changes

    // Return the debounced value
    return debouncedValue;
};

export default useDebounce;