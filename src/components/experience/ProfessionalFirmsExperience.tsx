import React, { useState, useEffect } from 'react';

type Module = {
    id: string;
    label: string;
    status: 'disconnected' | 'connecting' | 'connected';
    icon: string;
};

export default function ProfessionalFirmsExperience() {
    const [state, setState] = useState<'idle' | 'processing' | 'completed'>('idle');
    const [modules, setModules] = useState<Module[]>([
        { id: 'schedule', label: '日程調整', status: 'disconnected', icon: '📅' },
        { id: 'inquiry', label: '問い合わせ', status: 'disconnected', icon: '📩' },
        { id: 'document', label: '資料回収', status: 'disconnected', icon: '📂' },
        { id: 'crm', label: '顧客管理', status: 'disconnected', icon: '👥' },
    ]);

    const startSimulation = () => {
        setState('processing');
    };

    useEffect(() => {
        if (state !== 'processing') return;

        let currentModuleIndex = 0;
        const interval = setInterval(() => {
            setModules(prev => {
                const newModules = [...prev];
                if (currentModuleIndex < newModules.length) {
                    newModules[currentModuleIndex].status = 'connected';
                }
                return newModules;
            });
            currentModuleIndex++;
            if (currentModuleIndex > modules.length) {
                clearInterval(interval);
                setTimeout(() => setState('completed'), 800);
            }
        }, 600);

        return () => clearInterval(interval);
    }, [state]);

    return (
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-200 font-sans my-12">
            <div className="p-6 bg-gradient-to-r from-neutral-800 to-neutral-900 border-b border-neutral-700 text-center">
                <h3 className="text-xl font-bold text-white">事務所OSの構築</h3>
                <p className="text-sm text-neutral-400 mt-1">バラバラな業務をひとつにつなぐ</p>
            </div>

            <div className="p-8 min-h-[400px] flex flex-col items-center justify-center relative">
                {/* Central Hub */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-4 ${state === 'completed' ? 'bg-blue-600 border-blue-200 shadow-[0_0_30px_rgba(37,99,235,0.5)]' : 'bg-neutral-800 border-neutral-600'
                    }`}>
                    <span className="text-3xl">🏢</span>
                </div>

                {/* Modules Orbiting (Static layout for simplicity but styled dynamically) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {modules.map((module, idx) => {
                        // Position in a circle (simplified with absolute checks for 4 items)
                        const positions = [
                            'top-8', // Top
                            'right-8', // Right (approx) - actually let's use flex grid logic or absolute
                            'bottom-8', // Bottom
                            'left-8'
                        ];
                        // Easier: use grid for "orbit" feel around center? 
                        // Let's use specific transforms.
                        // 0: -translate-y-24, 1: translate-x-32, 2: translate-y-24, 3: -translate-x-32
                        const transforms = [
                            'translate-y-[-120px]',
                            'translate-x-[120px]',
                            'translate-y-[120px]',
                            'translate-x-[-120px]'
                        ];

                        return (
                            <div key={module.id}
                                className={`absolute transition-all duration-700 ${transforms[idx]} flex flex-col items-center gap-2`}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all duration-500 border-2 ${module.status === 'connected' ? 'bg-white border-blue-500 scale-110 shadow-md' : 'bg-neutral-50 border-neutral-200 grayscale'
                                    }`}>
                                    {module.icon}
                                </div>
                                <span className={`text-xs font-bold transition-colors ${module.status === 'connected' ? 'text-blue-600' : 'text-neutral-400'
                                    }`}>{module.label}</span>

                                {/* Connection Line (Visualized as simple element pointing to center) */}
                                <div className={`absolute top-1/2 left-1/2 w-[120px] h-[2px] -z-10 origin-left transition-all duration-1000 ${module.status === 'connected' ? 'bg-blue-200 scale-x-100' : 'bg-transparent scale-x-0'
                                    }`} style={{
                                        transform: `translate(-50%, -50%) rotate(${idx * 90 + 90}deg) translateY(-40px) scaleX(${module.status === 'connected' ? 1 : 0})`
                                        // This custom styling is tricky without Tailwind arbitrariness.
                                        // Let's rely on the module "lighting up" instead of complex lines for this simple component.
                                    }}></div>
                            </div>
                        );
                    })}

                    {/* SVG Lines Layer for Connections */}
                    <svg className="absolute inset-0 w-full h-full -z-10" viewBox="0 0 400 400">
                        <defs>
                            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0" />
                                <stop offset="100%" stopColor="#2563EB" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        {/* Lines from center (200,200) to positions */}
                        {/* 0: 200, 80 */}
                        {/* 1: 320, 200 */}
                        {/* 2: 200, 320 */}
                        {/* 3: 80, 200 */}
                        {modules.map((m, i) => {
                            const coords = [
                                [200, 80], [320, 200], [200, 320], [80, 200]
                            ];
                            return (
                                <line key={i}
                                    x1="200" y1="200"
                                    x2={coords[i][0]} y2={coords[i][1]}
                                    stroke={m.status === 'connected' ? "#3B82F6" : "#E5E5E5"}
                                    strokeWidth={m.status === 'connected' ? "3" : "1"}
                                    strokeDasharray={m.status === 'connected' ? "0" : "5,5"}
                                    className="transition-all duration-700"
                                />
                            )
                        })}
                    </svg>
                </div>

                {state === 'idle' && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex flex-col items-center justify-center pt-32">
                        <button
                            onClick={startSimulation}
                            className="bg-neutral-900 hover:bg-black text-white px-8 py-4 rounded-full font-bold shadow-xl transform transition hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <span>構造化を開始する</span>
                        </button>
                    </div>
                )}

                {state === 'completed' && (
                    <div className="absolute bottom-8 bg-green-50 text-green-800 px-4 py-2 rounded-full text-xs font-bold animate-fade-in border border-green-100">
                        All Systems Operational
                    </div>
                )}
            </div>
        </div>
    );
}
