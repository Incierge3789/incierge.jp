import React, { useState, useEffect } from 'react';

type Step = {
    id: string;
    label: string;
    category: 'flow' | 'money';
    status: 'pending' | 'active' | 'completed';
    result?: string;
};

export default function BillingPaymentExperience() {
    const [state, setState] = useState<'idle' | 'processing' | 'completed'>('idle');
    const [steps, setSteps] = useState<Step[]>([
        { id: 'trigger', label: '業務完了ステータス検知', category: 'flow', status: 'pending', result: 'Job #1024: Completed' },
        { id: 'invoice', label: '請求書自動発行・送付', category: 'flow', status: 'pending', result: 'Inv #5001 Sent (Email)' },
        { id: 'payment', label: '決済実行 (カード/口座振替)', category: 'money', status: 'pending', result: 'Payment Successful' },
        { id: 'reconcile', label: '入金消込・仕訳計上', category: 'money', status: 'pending', result: 'Reconciled & Posted' },
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
                setTimeout(() => setState('completed'), 600);
            }
        }, 800);

        return () => clearInterval(interval);
    }, [state]);

    return (
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-200 font-sans my-12">
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 text-center">
                <h3 className="text-xl font-bold text-emerald-900">請求・消込オートパイロット</h3>
                <p className="text-sm text-emerald-600 mt-1">「未入金」と「消込」を過去のものに</p>
            </div>

            <div className="p-6">
                {state === 'idle' ? (
                    <div className="text-center space-y-6">
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-left space-y-2">
                            <div className="flex justify-between text-xs text-neutral-500">
                                <span>案件: 株式会社サンプル</span>
                                <span>決算申告</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="font-bold text-neutral-800">ステータス: 完了</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="font-bold text-neutral-800">請求処理を開始しますか？</p>
                            <button
                                onClick={startSimulation}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>全自動で処理する</span>
                            </button>
                            <p className="text-xs text-neutral-400">通帳を確認する必要はありません</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 relative">
                        {state === 'completed' && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-fade-in text-center p-4">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                    <span className="text-2xl font-bold">¥0</span>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">消込残高: ゼロ</h4>
                                <p className="text-xs text-gray-500 mt-2">会計ソフトへの記帳まで完了しました。<br />月次決算はいつでも締められます。</p>
                            </div>
                        )}

                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex gap-4 items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm ${step.status === 'completed' ? 'bg-emerald-500 text-white' :
                                        step.status === 'active' ? 'bg-white border-2 border-emerald-500 text-emerald-600 animate-pulse' :
                                            'bg-neutral-100 text-neutral-300'
                                    }`}>
                                    {step.category === 'money' ? '¥' : '→'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className={`font-bold text-sm ${step.status === 'active' ? 'text-emerald-700' :
                                                step.status === 'pending' ? 'text-neutral-400' : 'text-neutral-700'
                                            }`}>{step.label}</span>
                                    </div>
                                    <div className={`text-xs mt-1 transition-all duration-300 ${step.status === 'active' || step.status === 'completed' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                                        } ${step.status === 'completed' ? 'text-emerald-600' : 'text-emerald-500'}`}>
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
