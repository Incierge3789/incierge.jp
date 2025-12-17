import React, { useState, useEffect } from 'react';

type Step = {
    id: string;
    label: string;
    status: 'pending' | 'processing' | 'completed';
    notification: 'sent' | 'pending';
};

export default function ProgressReportingExperience() {
    const [state, setState] = useState<'idle' | 'processing' | 'completed'>('idle');
    const [steps, setSteps] = useState<Step[]>([
        { id: '1', label: '資料受領・着手', status: 'pending', notification: 'pending' },
        { id: '2', label: '書類作成・内部監査', status: 'pending', notification: 'pending' },
        { id: '3', label: '役所への電子申請', status: 'pending', notification: 'pending' },
        { id: '4', label: '審査完了・公文書取得', status: 'pending', notification: 'pending' },
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

                // Complete previous
                if (currentStepIndex > 0) newSteps[currentStepIndex - 1].status = 'completed';

                // Process current
                if (currentStepIndex < newSteps.length) {
                    newSteps[currentStepIndex].status = 'processing';
                    // Simulate notification instantly sending when processing starts (or completes)
                    // Let's say notification sends upon completion of previous? Or start of current?
                    // Typically status change triggers notification.
                    newSteps[currentStepIndex].notification = 'sent';
                }

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
            <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 text-center">
                <h3 className="text-xl font-bold text-orange-900">進捗報告オートパイロット</h3>
                <p className="text-sm text-orange-600 mt-1">「今どうなってますか？」を言わせない</p>
            </div>

            <div className="p-6 min-h-[400px] flex flex-col">
                {state === 'idle' ? (
                    <div className="flex-1 flex flex-col justify-center text-center space-y-6">
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                            <p className="text-sm text-neutral-500 mb-2">現在の顧客の心理</p>
                            <div className="flex justify-center gap-1">
                                <span className="text-2xl animate-bounce">🤔</span>
                                <span className="text-2xl animate-bounce delay-100">❓</span>
                                <span className="text-2xl animate-bounce delay-200">😟</span>
                            </div>
                            <p className="font-bold text-neutral-800 mt-2">「進んでいるのか不安...」</p>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={startSimulation}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>透明化を開始する</span>
                            </button>
                            <p className="text-xs text-neutral-400">ステータス更新ごとに自動通知</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 space-y-6">
                        <div className="flex justify-between items-center text-xs text-neutral-400 border-b border-neutral-100 pb-2">
                            <span>社内ステータス (Kintone/CRM)</span>
                            <span>顧客への通知 (Email/LINE)</span>
                        </div>

                        <div className="space-y-4">
                            {steps.map((step) => (
                                <div key={step.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${step.status === 'completed' ? 'bg-orange-500' :
                                                step.status === 'processing' ? 'bg-orange-300 animate-pulse' :
                                                    'bg-neutral-200'
                                            }`}></div>
                                        <span className={`text-sm font-bold transition-colors ${step.status === 'pending' ? 'text-neutral-300' : 'text-neutral-700'
                                            }`}>{step.label}</span>
                                    </div>

                                    <div className={`transition-all duration-500 flex items-center gap-1 ${step.notification === 'sent' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                                        }`}>
                                        <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-bold flex items-center gap-1 shadow-sm">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            Sent
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {state === 'completed' && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center animate-fade-in mt-4">
                                <p className="text-green-800 font-bold text-sm">信頼獲得成功</p>
                                <p className="text-green-600 text-xs mt-1">顧客は一度も問い合わせることなく<br />安心しています。</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
