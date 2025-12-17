import React, { useState, useEffect } from 'react';

type TimelineItem = {
    id: string;
    date: string;
    source: 'email' | 'chat' | 'phone' | 'system';
    content: string;
    status: 'hidden' | 'visible';
};

export default function CustomerManagementExperience() {
    const [state, setState] = useState<'idle' | 'processing' | 'completed'>('idle');
    const [items, setItems] = useState<TimelineItem[]>([
        { id: '1', date: 'Today 10:00', source: 'chat', content: '山田商事: 決算資料を送付しました (Chatwork)', status: 'hidden' },
        { id: '2', date: 'Yesterday 15:30', source: 'email', content: '担当佐藤: 修正依頼の件、承知しました', status: 'hidden' },
        { id: '3', date: 'Oct 20', source: 'system', content: 'Status Change: 決算業務開始', status: 'hidden' },
        { id: '4', date: 'Oct 15', source: 'phone', content: '電話メモ(所長): 今期の売上着地見込みについて相談', status: 'hidden' },
    ]);

    const startSimulation = () => {
        setState('processing');
    };

    useEffect(() => {
        if (state !== 'processing') return;

        let currentIndex = 0;
        const interval = setInterval(() => {
            setItems(prev => {
                const newItems = [...prev];
                if (currentIndex < newItems.length) {
                    newItems[currentIndex].status = 'visible';
                }
                return newItems;
            });
            currentIndex++;
            if (currentIndex > items.length) {
                clearInterval(interval);
                setTimeout(() => setState('completed'), 500);
            }
        }, 600);

        return () => clearInterval(interval);
    }, [state]);

    return (
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-200 font-sans my-12">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 text-center">
                <h3 className="text-xl font-bold text-blue-900">CRMオートメーション</h3>
                <p className="text-sm text-blue-600 mt-1">記憶に頼らず、事実を「検索」する</p>
            </div>

            <div className="p-6 min-h-[400px] flex flex-col">
                {state === 'idle' ? (
                    <div className="flex-1 flex flex-col justify-center text-center space-y-6">
                        <div className="relative">
                            <input
                                disabled
                                type="text"
                                value="山田商事"
                                className="w-full bg-neutral-100 border border-neutral-200 rounded-lg py-3 px-4 text-center font-bold text-neutral-600"
                            />
                            <div className="absolute right-4 top-3 text-neutral-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="font-bold text-neutral-800">散らばった情報を集約しますか？</p>
                            <button
                                onClick={startSimulation}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>タイムラインを表示</span>
                            </button>
                            <p className="text-xs text-neutral-400">メール・チャット・電話メモを一箇所へ</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-end border-b border-neutral-100 pb-2">
                            <h4 className="font-bold text-lg text-neutral-800">山田商事 <span className="text-xs font-normal text-white bg-blue-500 px-2 py-0.5 rounded-full ml-1">契約中</span></h4>
                            <span className="text-xs text-neutral-400">最終更新: Just now</span>
                        </div>

                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className={`flex gap-3 transition-all duration-500 ${item.status === 'visible' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                                    <div className="flex flex-col items-center pt-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${item.source === 'chat' ? 'bg-red-100 text-red-600' :
                                                item.source === 'email' ? 'bg-yellow-100 text-yellow-600' :
                                                    item.source === 'system' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-green-100 text-green-600'
                                            }`}>
                                            {item.source === 'chat' ? 'C' : item.source === 'email' ? 'E' : item.source === 'system' ? 'S' : 'P'}
                                        </div>
                                        <div className="w-0.5 h-full bg-neutral-100 my-1 last:hidden"></div>
                                    </div>
                                    <div className="flex-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-sm">
                                        <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                            <span className="capitalize">{item.source}</span>
                                            <span>{item.date}</span>
                                        </div>
                                        <div className="text-neutral-700">{item.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {state === 'completed' && (
                            <div className="text-center pt-4 animate-fade-in text-xs text-blue-500 font-bold">
                                ↑ 全ての情報がここにあります
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
