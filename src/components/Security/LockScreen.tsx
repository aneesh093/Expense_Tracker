import { useState, useEffect, useCallback } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Fingerprint, Delete, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LockScreen() {
    const { unlockApp, useBiometrics, passcode } = useFinanceStore();
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    const handleNumber = (num: string) => {
        if (input.length < 4) {
            setError(false);
            const newInput = input + num;
            setInput(newInput);

            if (newInput.length === 4) {
                const success = unlockApp(newInput);
                if (!success) {
                    setError(true);
                    setTimeout(() => setInput(''), 500);
                }
            }
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
        setError(false);
    };

    const triggerBiometrics = useCallback(async () => {
        if (!useBiometrics) return;

        try {
            // Simple check to trigger system biometric prompt
            // Note: This is a "proof of presence" approach for local-only web apps
            if (window.PublicKeyCredential) {
                // We're not actually verifying a signature here, just using the prompt
                // In a real production app with a backend, we'd use a real challenge
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);

                await navigator.credentials.get({
                    publicKey: {
                        challenge,
                        timeout: 60000,
                        userVerification: 'required',
                        allowCredentials: [] // This will trigger a generic platform prompt on most devices
                    }
                });

                // If the promise resolves, user is authenticated
                if (passcode) unlockApp(passcode);
            }
        } catch (err) {
            console.error('Biometric authentication failed:', err);
        }
    }, [useBiometrics, passcode, unlockApp]);

    useEffect(() => {
        if (useBiometrics) {
            triggerBiometrics();
        }
    }, [useBiometrics, triggerBiometrics]);

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-600 to-blue-900 flex flex-col items-center justify-center p-6 text-white min-h-screen">
            <div className="mb-12 text-center">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-lg">
                    <Lock className="text-white" size={40} />
                </div>
                <h1 className="text-2xl font-bold mb-2">Finance Tracker</h1>
                <p className="text-blue-200 text-sm">Enter Passcode to Unlock</p>
            </div>

            <div className="flex gap-4 mb-12">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-4 h-4 rounded-full border-2 border-white/50 transition-all duration-200",
                            input.length >= i ? "bg-white border-white scale-110" : "bg-transparent",
                            error && "border-red-400 bg-red-400 animate-shake"
                        )}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-6 sm:gap-8 max-w-xs w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumber(num.toString())}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-2xl font-semibold backdrop-blur-md transition-colors"
                    >
                        {num}
                    </button>
                ))}

                <div className="flex items-center justify-center">
                    {useBiometrics && (
                        <button
                            onClick={triggerBiometrics}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
                        >
                            <Fingerprint size={32} />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => handleNumber('0')}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-2xl font-semibold backdrop-blur-md transition-colors"
                >
                    0
                </button>

                <button
                    onClick={handleDelete}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                    <Delete size={28} />
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}} />
        </div>
    );
}
