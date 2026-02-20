import React, { useState } from 'react';
import { Camera, Sun, UserCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const Calibration = ({ onComplete }) => {
    const [status, setStatus] = useState({
        webcam: false,
        lighting: false,
        identity: false,
    });

    const allClear = status.webcam && status.lighting && status.identity;

    const StatusCard = ({ icon: Icon, title, isDone, onToggle, colorClass }) => (
        <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${isDone
                ? 'bg-emerald-500/10 border-emerald-500/50'
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${isDone ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                    <Icon className={`w-6 h-6 ${isDone ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-in zoom-in duration-300" />
                ) : (
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 mb-4">
                {isDone
                    ? `${title} confirmed and ready.`
                    : `Waiting for ${title.toLowerCase()} validation...`}
            </p>
            <button
                onClick={onToggle}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${isDone
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
            >
                {isDone ? 'Verified' : `Verify ${title}`}
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl w-full mx-auto p-6">
            <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-white mb-3">System Calibration</h2>
                <p className="text-slate-400">Please complete all checks to proceed to the examination.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatusCard
                    icon={Camera}
                    title="Webcam Permission"
                    isDone={status.webcam}
                    onToggle={() => setStatus(s => ({ ...s, webcam: !s.webcam }))}
                />
                <StatusCard
                    icon={Sun}
                    title="Room Lighting"
                    isDone={status.lighting}
                    onToggle={() => setStatus(s => ({ ...s, lighting: !s.lighting }))}
                />
                <StatusCard
                    icon={UserCheck}
                    title="Identity Verified"
                    isDone={status.identity}
                    onToggle={() => setStatus(s => ({ ...s, identity: !s.identity }))}
                />
            </div>

            <div className="flex flex-col items-center border-t border-slate-800 pt-8">
                {!allClear && (
                    <div className="flex items-center gap-2 text-amber-400 text-sm mb-6 bg-amber-400/10 px-4 py-2 rounded-full border border-amber-400/20">
                        <AlertCircle className="w-4 h-4" />
                        <span>Complete all steps above to unlock the entrance.</span>
                    </div>
                )}
                <button
                    disabled={!allClear}
                    onClick={onComplete}
                    className={`px-10 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform ${allClear
                            ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:scale-105 hover:shadow-emerald-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed grayscale'
                        }`}
                >
                    Begin Examination
                </button>
            </div>
        </div>
    );
};

export default Calibration;
