import React, { useState, useEffect } from 'react';
import Chat from '../components/Chat';
import logo from '../assets/logo.png';
import { getApiKey, saveApiKey } from '../utils/storage';

function App() {
    const [apiKey, setApiKey] = useState('');
    const [hasKey, setHasKey] = useState(false);
    const [hasSavedKey, setHasSavedKey] = useState(false);

    useEffect(() => {
        const loadKey = async () => {
            const key = await getApiKey();
            if (key) {
                setApiKey(key);
                setHasKey(true);
                setHasSavedKey(true);
            }
        };
        loadKey();
    }, []);

    const handleSaveKey = async () => {
        if (!apiKey.trim()) return;
        await saveApiKey(apiKey);
        setHasKey(true);
        setHasSavedKey(true);
    };

    const handleCloseSettings = async () => {
        const key = await getApiKey();
        if (key) {
            setApiKey(key);
            setHasKey(true);
        }
    };

    if (!hasKey) {
        return (
            <div className="flex items-center justify-center h-dvh bg-gray-50 relative p-4">
                {hasSavedKey && (
                    <button
                        onClick={handleCloseSettings}
                        className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                )}
                <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 mx-auto">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 mb-4 flex items-center justify-center">
                            <img src={logo} alt="In-Context Agent Logo" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">In-Context Agent</h1>
                        <p className="text-xs text-gray-500 mt-1">Enter your Groq API Key to continue</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Groq API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all placeholder:text-gray-400"
                                placeholder="gsk_..."
                            />
                            <a
                                href="https://console.groq.com/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[10px] text-blue-500 hover:text-blue-600 mt-1.5 ml-1 text-right"
                            >
                                Get your API key here &rarr;
                            </a>
                        </div>
                        <button
                            onClick={handleSaveKey}
                            disabled={!apiKey.trim()}
                            className="w-full bg-black text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20"
                        >
                            Get Started
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-gray-400 mt-6">
                        Your key is stored locally on your device.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-dvh flex flex-col bg-white font-sans">
            <header className="h-14 px-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <img src={logo} alt="In-Context Agent" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="font-bold text-sm text-gray-900 tracking-tight">In-Context Agent</h1>
                </div>
                <button
                    onClick={() => setHasKey(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </header>
            <main className="flex-1 overflow-hidden flex flex-col relative">
                <Chat apiKey={apiKey} />
            </main>
        </div>
    );
}

export default App;
