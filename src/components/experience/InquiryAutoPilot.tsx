import React, { useState, useEffect } from 'react';

// Types for the simulation state
type AnalysisStep = {
    id: string;
    label: string;
    status: 'pending' | 'active' | 'completed';
    result?: string;
};

// Mock data for the incoming inquiry
const INCOMING_INQUIRY = {
    sender: "株式会社山田商事 山田太郎",
    subject: "顧問契約の更新と請求書について",
    body: `お世話になっております、山田商事の山田です。

来月の顧問契約の更新についてですが、プランの見直しを相談させてください。
また、先月分の請求書について一点確認したいことがございます。
明細の3行目の金額が前回と異なっているようなのですが、ご確認いただけますでしょうか。

お忙しいところ恐縮ですが、よろしくお願いいたします。`
};

export default function InquiryAutoPilot() {
    const [state, setState] = useState<'idle' | 'processing' | 'completed'>('idle');
    const [steps, setSteps] = useState<AnalysisStep[]>([
        { id: 'ocr', label: 'テキスト解析・意図抽出', status: 'pending', result: '意図: [契約更新], [請求確認]' },
        { id: 'crm', label: 'CRM照合・顧客ランク確認', status: 'pending', result: '顧客: VIP / 契約: 3年目' },
        { id: 'triage', label: '緊急度判定・担当割当', status: 'pending', result: '緊急度: 高 / 担当: 所長, 経理担当' },
        { id: 'draft', label: '回答案生成・TICKET発行', status: 'pending', result: 'Action: ドラフト作成完了' },
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

                // Complete previous step
                if (currentStepIndex > 0) {
                    newSteps[currentStepIndex - 1].status = 'completed';
                }

                // Activate current step
                if (currentStepIndex < newSteps.length) {
                    newSteps[currentStepIndex].status = 'active';
                }

                return newSteps;
            });

            currentStepIndex++;

            if (currentStepIndex > steps.length) {
                clearInterval(interval);
                setTimeout(() => setState('completed'), 600);
            }
        }, 800); // Speed of each step

        return () => clearInterval(interval);
    }, [state]);

    return (
        <div className="w-full max-w-4xl mx-auto font-sans text-neutral-800 my-16">

            {/* Context Header */}
            <div className="text-center mb-8">
                <p className="text-xs font-bold tracking-widest text-blue-600 mb-2">INCIERGE AUTO-PILOT</p>
                <h3 className="text-2xl font-bold">「何もせず」に終わらせる</h3>
                <p className="text-sm text-neutral-500 mt-2">読む・考える・打つ。その全てをシステムに任せる体験</p>
            </div>

            <div className="relative bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden md:flex min-h-[500px]">

                {/* LEFT PANEL: The Inquiry (Problem) */}
                <div className={`md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-neutral-100 transition-opacity duration-500 ${state === 'completed' ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-red-500">新着メッセージ受信</span>
                    </div>

                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 shadow-sm relative overflow-hidden group">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-neutral-500 border-b border-neutral-200 pb-2 mb-2 text-xs">
                                <span>From: {INCOMING_INQUIRY.sender}</span>
                                <span>Just now</span>
                            </div>
                            <div className="font-bold">{INCOMING_INQUIRY.subject}</div>
                            <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                                {INCOMING_INQUIRY.body}
                            </div>
                        </div>

                        {/* Button Overlay (Idle State) */}
                        {state === 'idle' && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-xs font-bold text-neutral-500">読み取る必要はありません</span>
                            </div>
                        )}
                    </div>

                    {state === 'idle' && (
                        <div className="mt-8 text-center space-y-4">
                            <p className="text-sm text-neutral-600 font-medium">
                                あなたがやるべきことは、これだけです。
                            </p>
                            <button
                                onClick={startSimulation}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                システムに一任する
                            </button>
                            <p className="text-xs text-neutral-400">
                                ※ ボタンを押すと、0秒で処理が完了します
                            </p>
                        </div>
                    )}

                    {state !== 'idle' && (
                        <div className="mt-8 space-y-3">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">System Processing</p>
                            {steps.map((step) => (
                                <div key={step.id} className="flex items-center gap-3 text-sm">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${step.status === 'completed' ? 'bg-blue-600 border-blue-600 text-white' :
                                            step.status === 'active' ? 'border-blue-600 text-blue-600' :
                                                'border-neutral-200 text-neutral-300'
                                        }`}>
                                        {step.status === 'completed' && (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {step.status === 'active' && (
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-medium ${step.status === 'pending' ? 'text-neutral-400' : 'text-neutral-700'}`}>
                                            {step.label}
                                        </div>
                                        {step.status !== 'pending' && (
                                            <div className="text-xs text-blue-600 mt-0.5 animate-fade-in-up">
                                                {step.result}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: Result (Solution) */}
                <div className={`md:w-1/2 bg-blue-50/50 p-6 md:p-8 flex flex-col transition-all duration-700 ${state === 'completed' ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4 grayscale'}`}>

                    <div className="flex-1 flex flex-col justify-center">
                        {state === 'completed' ? (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-900">処理完了</span>
                                        <span className="text-xs text-neutral-500">Auto-Reply Sent</span>
                                    </div>
                                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Success
                                    </div>
                                </div>

                                {/* Generated Artifact */}
                                <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5 scale-100 transition-transform">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">自動生成された下書き</span>
                                        <span className="text-xs text-neutral-400">0.05s生成</span>
                                    </div>
                                    <div className="prose prose-sm max-w-none text-neutral-700 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                                        {`山田様
いつも大変お世話になっております。
INCIERGE法律事務所でございます。

お問い合わせいただきました件につきまして、以下の通り対応いたします。

1. 顧問契約プランの見直しについて
担当パートナー（佐藤）にて、貴社の現状に合わせた新プランをご提案いたします。別途日程調整のご連絡を差し上げます。

2. 請求書の内容確認について
経理担当にて至急確認を行い、明日12:00までにご報告いたします。

本メールはシステムによる自動応答ですが、
担当者へのタスク割り当ては完了しております。
今しばらくお待ちくださいませ。`}
                                    </div>
                                </div>

                                {/* Dashboard Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-lg border border-neutral-100 text-center">
                                        <div className="text-xs text-neutral-500 mb-1">あなたの作業時間</div>
                                        <div className="text-xl font-bold text-neutral-900">0 <span className="text-sm font-normal">秒</span></div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-neutral-100 text-center">
                                        <div className="text-xs text-neutral-500 mb-1">下した判断数</div>
                                        <div className="text-xl font-bold text-neutral-900">0 <span className="text-sm font-normal">回</span></div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                <div className="w-16 h-16 rounded-2xl bg-neutral-200"></div>
                                <div className="w-3/4 h-4 bg-neutral-200 rounded"></div>
                                <div className="w-1/2 h-4 bg-neutral-200 rounded"></div>
                                <p className="text-sm text-neutral-400 mt-8 font-medium">Waiting for system...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
