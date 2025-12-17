import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { personaAtom, rateAtom, countAtom, isSolutionRevealedAtom } from '../../stores/experienceStore';
import type { Persona } from '../../lib/experience/generateScheduleEmail';

const PERSONA_OPTIONS: { value: Persona; label: string }[] = [
    { value: 'tax_accountant', label: '税理士' },
    { value: 'labor_consultant', label: '社会保険労務士' },
    { value: 'administrative_scrivener', label: '行政書士' },
    { value: 'judicial_scrivener', label: '司法書士' },
    { value: 'professional_firms', label: 'その他士業' },
];

const TIME_PER_OCCURRENCE_MIN = 10;

interface Props {
    initialPersona?: Persona;
}

export default function CostDiagnosis({ initialPersona = 'tax_accountant' }: Props) {
    const persona = useStore(personaAtom);
    const rate = useStore(rateAtom);
    const count = useStore(countAtom);
    const isRevealed = useStore(isSolutionRevealedAtom);

    useEffect(() => {
        if (initialPersona) {
            personaAtom.set(initialPersona);
        }
    }, [initialPersona]);

    // Computed Values
    const annualHours = Math.round((count * 12 * TIME_PER_OCCURRENCE_MIN) / 60);
    const annualCost = annualHours * rate;

    const handleReveal = () => {
        isSolutionRevealedAtom.set(true);
        // Smooth scroll to the next section slightly
        setTimeout(() => {
            const el = document.getElementById('solution-start');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    return (
        <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white/50 backdrop-blur-sm border border-red-100 shadow-xl overflow-hidden p-6 md:p-10 font-sans text-gray-800 my-16">

            {/* Header */}
            <div className="mb-8 text-center">
                <h3 className="text-xl font-bold text-red-700">
                    現状の損失コストを診断
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                    あなたの単価と調整頻度を入力してください
                </p>
            </div>

            <div className="flex flex-col gap-6">

                {/* Persona Selector */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {PERSONA_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => personaAtom.set(opt.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                ${persona === opt.value
                                    ? 'bg-red-600 text-white shadow-md'
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
                            onChange={(e) => rateAtom.set(Number(e.target.value))}
                            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/80"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">月間調整回数 (回)</label>
                        <input
                            type="number"
                            value={count}
                            onChange={(e) => countAtom.set(Number(e.target.value))}
                            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/80"
                        />
                    </div>
                </div>

                {/* Diagnosis Result Card */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100 shadow-inner text-center">
                    <h4 className="text-xs font-bold text-red-800 mb-2 uppercase tracking-widest">
                        年間損失コスト（推計）
                    </h4>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                        <span className="text-4xl md:text-5xl font-extrabold text-red-900 tracking-tight">
                            ¥{annualCost.toLocaleString()}
                        </span>
                        <span className="text-sm text-red-700 font-medium">
                            / 年
                        </span>
                    </div>
                    <p className="text-sm text-red-600">
                        ≈ 年間 <span className="font-bold">{annualHours} 時間</span> を失っています
                    </p>
                </div>

                {/* Reveal Button */}
                {!isRevealed && (
                    <button
                        onClick={handleReveal}
                        className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all transform active:scale-95 flex flex-col items-center justify-center gap-1 animate-pulse-slow"
                    >
                        <span className="text-sm md:text-base">このコストは完全に「0」にできます</span>
                        <span className="text-xs md:text-sm text-gray-400">その方法を以下で体験してください ↓</span>
                    </button>
                )}
            </div>
        </div>
    );
}
