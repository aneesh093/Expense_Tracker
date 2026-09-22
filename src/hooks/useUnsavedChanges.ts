import { useEffect, useCallback } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';

/**
 * Hook that warns users when they try to navigate away from a page with unsaved changes.
 * Handles both in-app navigation (via React Router) and browser-level navigation
 * (tab close, refresh, browser back).
 *
 * @param hasUnsavedChanges - Whether the form currently has unsaved data
 * @param message - Custom confirmation message (optional)
 */
export function useUnsavedChanges(
    hasUnsavedChanges: boolean,
    message: string = 'You have unsaved changes. Are you sure you want to leave? Your entered data will be lost.'
) {
    const shouldBlock = useCallback<BlockerFunction>(
        ({ currentLocation, nextLocation }) => {
            if (!hasUnsavedChanges) return false;
            return currentLocation.pathname !== nextLocation.pathname;
        },
        [hasUnsavedChanges]
    );

    // Block in-app navigation via React Router when path changes
    const blocker = useBlocker(shouldBlock);

    // Show confirmation dialog when blocker is triggered
    useEffect(() => {
        if (blocker.state === 'blocked') {
            const proceed = window.confirm(message);
            if (proceed) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker, message]);

    // Handle browser-level navigation (tab close, refresh, external back)
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            // Modern browsers show their own message, but returnValue is still needed
            e.returnValue = message;
            return message;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, message]);
}
