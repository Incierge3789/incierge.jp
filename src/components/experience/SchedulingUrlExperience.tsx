import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { personaAtom } from '../../stores/experienceStore';

const PERSONA_SLUGS: Record<string, string> = {
    tax_accountant: 'yamada-tax',
    labor_consultant: 'sato-labor',
    administrative_scrivener: 'suzuki-office',
    judicial_scrivener: 'tanaka-legal',
};

export default function SchedulingUrlExperience() {
    const persona = useStore(personaAtom);
    const [step, setStep] = useState<'url' | 'client' | 'done'>('url');

    const slug = PERSONA_SLUGS[persona] || 'your-office';
    const url = `https://incierge.jp/book/${slug}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(url).catch(() => { });
        setStep('client');
    };

    const handleBook = () => {
        setStep('done');
    };

    return (
        <div className="w-full max-w-4xl mx-auto my-16 font-sans text-gray-800">

            {/* Header */}
            <div className="mb-8 text-center transition-all duration-500">
                <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                    日程調整を「消去」する体験
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                    {step === 'url' && "あなたがやるべきことは、このURLを1つ送るだけです。"}
                    {step === 'client' && "顧問先（相手）は、スマホでこの画面を見ます。"}
                    {step === 'done' && "すべてが完了しました。"}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Left Column: Your Action */}
                <div className={`transition-all duration-500 ${step === 'done' ? 'opacity-50 blur-sm grayscale' : 'opacity-100'}`}>
                    <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl relative overflow-hidden">
                        <div className="text-xs font-bold text-blue-500 mb-2 uppercase tracking-wide">Step 1: Your Action</div>
                        <h4 className="text-lg font-bold text-gray-800 mb-6">URLをコピーして送る</h4>

                        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-200 mb-6">
                            <code className="text-sm text-gray-600 truncate">{url}</code>
                        </div>

                        <button
                            onClick={handleCopy}
                            disabled={step !== 'url'}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform flex items-center justify-center gap-2
                  ${step === 'url'
                                    ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1'
                                    : 'bg-green-600 cursor-default'}`}
                        >
                            {step === 'url' ? (
                                <><span>🔗 URLをコピーする</span></>
                            ) : (
                                <><span>✓ コピー完了</span></>
                            )}
                        </button>

                        {step === 'url' && (
                            <p className="text-xs text-gray-400 mt-4 text-center">
                                ※ クリックすると、相手側の画面（シミュレーション）が表示されます
                            </p>
                        )}
                    </div>

                    {step === 'done' && (
                        <div className="mt-6 text-center">
                            <p className="text-sm font-bold text-gray-400">あなたの作業はここまでです。<br />あとは全自動で進みます。</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Client Experience */}
                <div className={`transition-all duration-700 transform ${step === 'url' ? 'translate-y-4 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                    {step !== 'url' && (
                        <div className="relative">
                            {/* Phone Frame */}
                            <div className="bg-gray-900 rounded-[2.5rem] p-4 shadow-2xl mx-auto max-w-[320px] border-4 border-gray-800">
                                <div className="bg-white rounded-[2rem] overflow-hidden h-[500px] flex flex-col relative">

                                    {/* Client View Header */}
                                    <div className="bg-gray-50 p-4 border-b border-gray-100 text-center">
                                        <p className="text-[10px] text-gray-400 mb-1">incierge.jp</p>
                                        <p className="text-sm font-bold text-gray-800">顧問面談（60分）</p>
                                    </div>

                                    {/* Client View Content */}
                                    <div className="flex-1 p-4 overflow-y-auto">
                                        {step === 'client' ? (
                                            <div className="animate-fade-in">
                                                <p className="text-xs text-gray-600 mb-4 text-center">ご都合の良い日時を選択してください。</p>
                                                <div className="space-y-2">
                                                    {['12/20 (月) 14:00', '12/21 (火) 10:00', '12/22 (水) 16:00'].map((date, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={handleBook}
                                                            className="w-full py-3 px-4 bg-white border border-blue-100 rounded-lg text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors text-left flex justify-between items-center group"
                                                        >
                                                            <span>{date}</span>
                                                            <span className="text-gray-300 group-hover:text-blue-400">→</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in-up">
                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-500 text-2xl">
                                                    ✓
                                                </div>
                                                <h5 className="font-bold text-gray-800 mb-2">予約完了</h5>
                                                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                                                    カレンダーに登録しました。<br />
                                                    Zoom URLをメールで送付しました。
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Bar */}
                                    <div className="bg-gray-50 p-3 text-center text-[10px] text-gray-300">
                                        Powered by INCIERGE
                                    </div>

                                    {/* Overlay for Done State */}
                                    {step === 'done' && (
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white to-transparent h-1/2 flex items-end justify-center pb-8">
                                            {/* Just visual padding */}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Success Popout */}
                            {step === 'done' && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[340px] z-20">
                                    <div className="bg-white/90 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-2xl text-center animate-pop-in">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Result</p>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-1">所要時間 0秒</h3>
                                        <p className="text-xs text-gray-500 mb-4">メール作成も、カレンダー登録も不要です</p>
                                        <div className="flex flex-col gap-2 text-left text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span> あなたのGoogleカレンダー連携済
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span> Zoom URL 自動発行済
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span> 前日リマインド 自動設定済
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
        </div>
    );
}
