import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { Shield, Lock, Fingerprint, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function SecuritySettings() {
    const navigate = useNavigate();
    const { passcode, useBiometrics, setPasscode, setUseBiometrics } = useFinanceStore();

    const [isSettingPasscode, setIsSettingPasscode] = useState(false);
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
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
    };

    const handleDisableSecurity = () => {
        if (window.confirm('Are you sure you want to disable all security? Your data will be accessible to anyone with this device.')) {
            setPasscode(null);
            setUseBiometrics(false);
        }
    };

    const supportsBiometrics = !!window.PublicKeyCredential;

    return (
        <div className="space-y-6 pb-20">
            <header className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/settings')}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-start space-x-3">
                    <Shield className="text-blue-600 mt-0.5" size={20} />
                    <p className="text-sm text-blue-800">
                        Security features protect your financial data from unauthorized access on this device.
                    </p>
                </div>

                <div className="p-4 space-y-6">
                    {/* Passcode Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <Lock size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">Passcode Lock</p>
                                <p className="text-xs text-gray-500">Require a 4-digit code to open the app</p>
                            </div>
                        </div>
                        <button
                            onClick={() => passcode ? handleDisableSecurity() : setIsSettingPasscode(true)}
                            className={cn(
                                "w-12 h-6 rounded-full transition-colors relative",
                                passcode ? "bg-blue-600" : "bg-gray-200"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                passcode ? "right-1" : "left-1"
                            )} />
                        </button>
                    </div>

                    {/* Biometrics Toggle */}
                    {supportsBiometrics && (
                        <div className={cn(
                            "flex items-center justify-between transition-opacity",
                            !passcode && "opacity-50 pointer-events-none"
                        )}>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    <Fingerprint size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Biometric Unlock</p>
                                    <p className="text-xs text-gray-500">Use FaceID or TouchID</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setUseBiometrics(!useBiometrics)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    useBiometrics ? "bg-blue-600" : "bg-gray-200"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                    useBiometrics ? "right-1" : "left-1"
                                )} />
                            </button>
                        </div>
                    )}

                    {passcode && (
                        <button
                            onClick={() => setIsSettingPasscode(true)}
                            className="w-full py-3 text-sm font-semibold text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
                        >
                            Change Passcode
                        </button>
                    )}
                </div>
            </div>

            {/* Set Passcode Modal/Overlay */}
            {isSettingPasscode && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-6 text-center">Set 4-Digit Passcode</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center space-x-2">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Enter Passcode</label>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={4}
                                        value={newPasscode}
                                        onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-2xl tracking-[1em] py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="••••"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Confirm Passcode</label>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={4}
                                        value={confirmPasscode}
                                        onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-2xl tracking-[1em] py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="••••"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setIsSettingPasscode(false);
                                            setNewPasscode('');
                                            setConfirmPasscode('');
                                            setError('');
                                        }}
                                        className="flex-1 py-3 font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSetPasscode}
                                        className="flex-1 py-3 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center space-x-2"
                                    >
                                        <Check size={20} />
                                        <span>Save</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
