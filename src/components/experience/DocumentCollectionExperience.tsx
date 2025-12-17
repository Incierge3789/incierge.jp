import React, { useState, useEffect } from 'react';

type Step = {
    id: string;
    label: string;
    status: 'pending' | 'active' | 'completed';
    date: string;
    result?: string;
};

export default function DocumentCollectionExperience() {
    const [state, setState] = useState<'idle' | 'processing' | 'completed'>('idle');
    const [steps, setSteps] = useState<Step[]>([
        { id: 'request', label: '資料提出依頼を送信', status: 'pending', date: 'Day 1', result: 'Sent via Email/LINE' },
        { id: 'remind1', label: '未提出者に自動リマインド', status: 'pending', date: 'Day 3', result: 'Auto-Reminded (Opened)' },
        { id: 'upload', label: '顧客がアップロード', status: 'pending', date: 'Day 4', result: '3 files received' },
        { id: 'check', label: '形式チェック・振分', status: 'pending', date: 'Day 4', result: 'PDF/JPG Validated' },
    ]);

    const startSimulation = () => {
        setState('processing');
    };

    useEffect(() => {
        if (state !== 'processing') return;

        let currentStepIndex = 0;
        const interval = setInterval(() => {
            setSteps(prev => {
                const newSteps = [...prev];
                if (currentStepIndex > 0) newSteps[currentStepIndex - 1].status = 'completed';
                if (currentStepIndex < newSteps.length) newSteps[currentStepIndex].status = 'active';
                return newSteps;
            });

            currentStepIndex++;
            if (currentStepIndex > steps.length) {
                clearInterval(interval);
                setTimeout(() => setState('completed'), 500);
            }
        }, 800);

        return () => clearInterval(interval);
    }, [state]);

    return (
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-200 font-sans my-12">
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100 text-center">
                <h3 className="text-xl font-bold text-indigo-900">資料回収オートパイロット</h3>
                <p className="text-sm text-indigo-600 mt-1">「督促」のストレスをゼロにする</p>
            </div>

            <div className="p-6">
                {state === 'idle' ? (
                    <div className="text-center space-y-6">
                        <div className="space-y-2">
                            <p className="font-bold text-neutral-800">必要な資料リストを選択してください</p>
                            <div className="inline-block bg-neutral-100 px-4 py-2 rounded-lg text-sm text-neutral-600">
                                📋 確定申告資料セット
                            </div>
                        </div>
                        <button
                            onClick={startSimulation}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>回収を開始する</span>
                        </button>
                        <p className="text-xs text-neutral-400">あなたは開始ボタンを押すだけです</p>
                    </div>
                ) : (
                    <div className="space-y-6 relative">
                        {state === 'completed' && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-fade-in text-center p-4">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">回収完了</h4>
                                <p className="text-sm text-gray-600 mt-2">フォルダに自動保存されました。<br />督促メールを一通も書く必要はありません。</p>
                            </div>
                        )}

                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${step.status === 'completed' ? 'bg-indigo-600 text-white' :
                                            step.status === 'active' ? 'bg-white border-2 border-indigo-600 text-indigo-600' :
                                                'bg-neutral-100 text-neutral-400'
                                        }`}>
                                        {step.status === 'completed' ? '✓' : idx + 1}
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`w-0.5 flex-1 my-1 ${step.status === 'completed' ? 'bg-indigo-200' : 'bg-neutral-100'}`}></div>
                                    )}
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold text-sm ${step.status === 'active' ? 'text-indigo-700' :
                                                step.status === 'pending' ? 'text-neutral-400' : 'text-neutral-700'
                                            }`}>{step.label}</span>
                                        <span className="text-xs font-mono text-neutral-400">{step.date}</span>
                                    </div>
                                    <div className={`text-xs pl-2 border-l-2 ${step.status === 'active' ? 'border-indigo-400 text-indigo-600' :
                                            step.status === 'completed' ? 'border-green-300 text-green-600' : 'border-transparent text-transparent'
                                        }`}>
                                        {step.result}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
