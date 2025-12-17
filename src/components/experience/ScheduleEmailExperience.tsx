import React, { useState, useEffect } from 'react';
import { generateScheduleEmail, type Persona } from '../../lib/experience/generateScheduleEmail';

interface Props {
    initialPersona?: Persona;
}

const PERSONA_OPTIONS: { value: Persona; label: string }[] = [
    { value: 'tax_accountant', label: '税理士' },
    { value: 'labor_consultant', label: '社会保険労務士' },
    { value: 'administrative_scrivener', label: '行政書士' },
    { value: 'judicial_scrivener', label: '司法書士' },
];

export default function ScheduleEmailExperience({ initialPersona = 'tax_accountant' }: Props) {
    const [persona, setPersona] = useState<Persona>(initialPersona);
    const [rate, setRate] = useState<number>(6000);
    const [count, setCount] = useState<number>(20);
    const [memo, setMemo] = useState<string>('来週火曜 14:00 または 12/20 午前中。Zoomで。');
    const [email, setEmail] = useState<{ subject: string; body: string }>({ subject: '', body: '' });

    // Diagnosis Constants
    const TIME_PER_OCCURRENCE_MIN = 10;

    // Computed Values
    const annualHours = Math.round((count * 12 * TIME_PER_OCCURRENCE_MIN) / 60);
    const annualCost = annualHours * rate;

    useEffect(() => {
        handleGenerate();
    }, [persona]); // Regenerate on persona switch automatically

    const handleGenerate = () => {
        const result = generateScheduleEmail(persona, memo);
        setEmail(result);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${email.subject}\n\n${email.body}`)
            .then(() => alert('コピーしました'))
            .catch(() => alert('コピーに失敗しました'));
    };

    return (
        <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white/50 backdrop-blur-sm border border-gray-200 shadow-xl overflow-hidden p-6 md:p-10 font-sans text-gray-800 my-16">

            {/* Header */}
            <div className="mb-8 text-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    日程調整コスト診断 & メール生成
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                    入力内容は保存されません。ブラウザ上で完結します。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

                {/* Left Column: Inputs & Diagnosis */}
                <div className="flex flex-col gap-6">

                    {/* Persona Selector */}
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {PERSONA_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPersona(opt.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${persona === opt.value
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Numeric Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">時間単価 (円)</label>
                            <input
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">月間調整回数 (回)</label>
                            <input
                                type="number"
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                            />
                        </div>
                    </div>

                    {/* Diagnosis Result Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-blue-100 shadow-inner">
                        <h4 className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-widest">
                            現状の損失コスト（年間推計）
                        </h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-extrabold text-blue-900 tracking-tight">
                                ¥{annualCost.toLocaleString()}
                            </span>
                            <span className="text-sm text-blue-700 font-medium">
                                / 年
                            </span>
                        </div>
                        <p className="text-sm text-blue-600 mt-2">
                            ≈ 年間 {annualHours} 時間を「調整作業」だけに費やしています
                        </p>
                    </div>

                    {/* Memo Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                            日程メモ (ぐちゃぐちゃでOK)
                        </label>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            className="w-full p-3 h-24 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 text-sm"
                            placeholder="例: 12/20 14時 or 12/21 午前なら可。場所はZoomで。"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all transform active:scale-95"
                    >
                        メールを生成する
                    </button>
                </div>

                {/* Right Column: Email Output */}
                <div className="relative flex flex-col h-full min-h-[400px]">
                    <div className="absolute -top-3 -right-3 z-10">
                        <button
                            onClick={copyToClipboard}
                            className="bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-400 px-4 py-2 rounded-full shadow-sm text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <span>📋 コピー</span>
                        </button>
                    </div>

                    <div className="flex-1 rounded-2xl border border-gray-200 bg-white/80 p-6 md:p-8 shadow-sm flex flex-col gap-4 overflow-y-auto">
                        <div className="border-b border-gray-100 pb-4">
                            <span className="text-xs font-bold text-gray-400 block mb-1">件名</span>
                            <p className="font-bold text-gray-800">{email.subject || '（生成ボタンを押してください）'}</p>
                        </div>
                        <div className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                            {email.body || '（ここにメール本文が生成されます）'}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
