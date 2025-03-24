import { useState, useEffect, useCallback } from 'react'; // v18.2.0
import { 
  getLocalStorageItem, 
  setLocalStorageItem, 
  removeLocalStorageItem 
} from '../utils/storage';

/**
 * A custom React hook that provides a stateful interface to the browser's localStorage API
 * with type safety, serialization/deserialization of complex objects, and error handling.
 *
 * @template T The type of value to be stored
 * @param {string} key The localStorage key to use
 * @param {T} initialValue The initial value to use if no value exists in localStorage
 * @returns {[T, (value: T | ((val: T) => T)) => void, () => void]} A tuple containing:
 *   - The current value
 *   - A function to update the value (similar to useState setter)
 *   - A function to remove the value from localStorage
 *
 * @example
 * ```tsx
 * // Store user theme preference
 * const [theme, setTheme, removeTheme] = useLocalStorage('userTheme', 'light');
 * 
 * // Store complex object
 * const [userPreferences, setUserPreferences, resetPreferences] = useLocalStorage(
 *   'userPreferences',
 *   { fontSize: 'medium', highContrast: false }
 * );
 * 
 * // Update the theme directly
 * setTheme('dark');
 * 
 * // Update based on previous value
 * setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
 * 
 * // Remove from localStorage and reset to initial value
 * removeTheme();
 * ```
 */
function useLocalStorage<T>(key: string, initialValue: T): [
  T,
  (value: T | ((val: T) => T)) => void,
  () => void
] {
  // Initialize state with the value from localStorage or the provided initialValue
  // Pass a function to useState to ensure it only runs once on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getLocalStorageItem<T>(key, initialValue);
  });

  // Create a memoized setValue function that updates both state and localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prevValue => {
      // Handle functional updates (same API as useState)
      const valueToStore = value instanceof Function ? value(prevValue) : value;
      
      // Update localStorage with the new value
      setLocalStorageItem(key, valueToStore);
      
      return valueToStore;
    });
  }, [key]);

  // Create a memoized removeValue function that clears from localStorage and resets state
  const removeValue = useCallback(() => {
    removeLocalStorageItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  // Set up an effect to sync state with localStorage changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue !== null) {
          try {
            // Parse and update state with the new value
            const newValue = JSON.parse(event.newValue) as T;
            setStoredValue(newValue);
          } catch (error) {
            console.error(`Failed to parse localStorage value for key "${key}":`, error);
          }
        } else {
          // If the item was removed in another tab, reset to initialValue
          setStoredValue(initialValue);
        }
      }
    };

    // Listen for storage events (these only fire in other tabs/windows, not the current one)
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;