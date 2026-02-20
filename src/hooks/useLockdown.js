import { useEffect, useCallback } from 'react';

export const useLockdown = (onViolation) => {
    const handleEvent = useCallback((type) => {
        const timestamp = new Date().toLocaleTimeString();
        onViolation({ type, timestamp });
    }, [onViolation]);

    useEffect(() => {
        // 1. Detect Tab Switching / Minimizing
        const handleVisibilityChange = () => {
            if (document.hidden) handleEvent("TAB_SWITCH_DETECTED");
        };

        // 2. Detect Window Focus Loss (Alt+Tab or clicking away)
        const handleBlur = () => handleEvent("WINDOW_FOCUS_LOST");

        // 3. Block Forbidden Shortcuts (Copy, Paste, DevTools)
        const handleKeyDown = (e) => {
            if (
                ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'p')) ||
                e.key === 'F12' || e.key === 'PrintScreen'
            ) {
                e.preventDefault();
                handleEvent(`SHORTCUT_BLOCKED_${e.key.toUpperCase()}`);
            }
        };

        // 4. Disable Right-Click
        const handleContextMenu = (e) => e.preventDefault();

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [handleEvent]);
};
