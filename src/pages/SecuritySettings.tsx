import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { Shield, Lock, Fingerprint, ChevronLeft, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

const PasscodeInput = ({ value, onChange, label, showPasscode }: { value: string, onChange: (val: string) => void, label: string, showPasscode: boolean }) => (
    <div className="w-full">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{label}</label>
        <div className="relative group">
            <input
                type={showPasscode ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl h-14 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none font-mono"
                placeholder="••••"
                style={{ letterSpacing: value ? '0.5em' : 'normal' }}
                autoFocus={label === "New Passcode"}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-4 pointer-events-none">
                {value.length > 0 && (
                    <div className="flex gap-1 items-center">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-2 h-2 rounded-full",
                                    i < value.length ? "bg-blue-600" : "bg-gray-200"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
);

export function SecuritySettings() {
    const navigate = useNavigate();
    const { passcode, useBiometrics, setPasscode, setUseBiometrics } = useFinanceStore();

    const [isSettingPasscode, setIsSettingPasscode] = useState(false);
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const [showPasscode, setShowPasscode] = useState(false);
    const [error, setError] = useState('');

    const handleSetPasscode = () => {
        if (newPasscode.length !== 4) {
            setError('Passcode must be 4 digits');
            return;
        }
        if (newPasscode !== confirmPasscode) {
            setError('Passcodes do not match');
            return;
        }

        setPasscode(newPasscode);
        setIsSettingPasscode(false);
        setNewPasscode('');
        setConfirmPasscode('');
        setError('');
        setShowPasscode(false);
    };

    const handleDisableSecurity = () => {
        if (window.confirm('Are you sure you want to disable all security? Your data will be accessible to anyone with this device.')) {
            setPasscode(null);
            setUseBiometrics(false);
        }
    };

    const supportsBiometrics = !!window.PublicKeyCredential;

    return (
        <div className="space-y-6 pb-20 max-w-lg mx-auto px-4 sm:px-0">
            <header className="flex items-center space-x-4 pt-4">
                <button
                    onClick={() => navigate('/settings')}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Security</h1>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 bg-blue-50/50 border-b border-blue-50 flex items-start space-x-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white">
                        <Shield size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-blue-900">Protect Your Data</p>
                        <p className="text-xs text-blue-700/70">
                            Ensure your financial information stays private on this device.
                        </p>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    {/* Passcode Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600">
                                <Lock size={22} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Passcode Lock</p>
                                <p className="text-xs text-gray-500">Require code to open app</p>
                            </div>
                        </div>
                        <button
                            onClick={() => passcode ? handleDisableSecurity() : setIsSettingPasscode(true)}
                            className={cn(
                                "w-14 h-8 rounded-full transition-all relative",
                                passcode ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-gray-200"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm",
                                passcode ? "right-1" : "left-1"
                            )} />
                        </button>
                    </div>

                    {/* Biometrics Toggle */}
                    {supportsBiometrics && (
                        <div className={cn(
                            "flex items-center justify-between transition-all",
                            !passcode && "opacity-40 grayscale pointer-events-none"
                        )}>
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600">
                                    <Fingerprint size={22} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Biometric Unlock</p>
                                    <p className="text-xs text-gray-500">FaceID or TouchID</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setUseBiometrics(!useBiometrics)}
                                className={cn(
                                    "w-14 h-8 rounded-full transition-all relative",
                                    useBiometrics ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-gray-200"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm",
                                    useBiometrics ? "right-1" : "left-1"
                                )} />
                            </button>
                        </div>
                    )}

                    {passcode && (
                        <button
                            onClick={() => setIsSettingPasscode(true)}
                            className="w-full py-4 text-sm font-bold text-blue-600 bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Lock size={18} />
                            Change Passcode
                        </button>
                    )}
                </div>
            </div>

            {/* Set Passcode Overlay */}
            {isSettingPasscode && (
                <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex items-end sm:items-center justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="p-8">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6 sm:hidden" />
                            <h2 className="text-2xl font-black mb-2 text-center text-gray-900">Security Code</h2>
                            <p className="text-center text-gray-500 text-sm mb-8">Set a 4-digit code to lock your app</p>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl flex items-center space-x-3 border border-red-100 animate-shake">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="relative">
                                    <PasscodeInput
                                        label="New Passcode"
                                        value={newPasscode}
                                        onChange={setNewPasscode}
                                        showPasscode={showPasscode}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasscode(!showPasscode)}
                                        className="absolute right-4 bottom-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPasscode ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                <PasscodeInput
                                    label="Confirm Passcode"
                                    value={confirmPasscode}
                                    onChange={setConfirmPasscode}
                                    showPasscode={showPasscode}
                                />

                                <div className="flex gap-4 pt-6">
                                    <button
                                        onClick={() => {
                                            setIsSettingPasscode(false);
                                            setNewPasscode('');
                                            setConfirmPasscode('');
                                            setError('');
                                            setShowPasscode(false);
                                        }}
                                        className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSetPasscode}
                                        disabled={newPasscode.length < 4 || confirmPasscode.length < 4}
                                        className={cn(
                                            "flex-1 py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2",
                                            newPasscode.length === 4 && confirmPasscode.length === 4
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        <Check size={20} />
                                        <span>Confirm</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}} />
        </div>
    );
}
