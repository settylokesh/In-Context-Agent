import React, { useState, useEffect, useRef } from 'react';
import { chatCompletion } from '../utils/groq';
import { MODELS as LOCAL_MODELS } from '../utils/models';
import MessageBubble from './MessageBubble';
import HistoryView from './HistoryView';
import { getConversations, saveConversation, deleteConversation, getCurrentConversationId, setCurrentConversationId, pinConversation } from '../utils/storage';

const Chat = ({ apiKey }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [availableModels, setAvailableModels] = useState(LOCAL_MODELS);
    const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b');
    const [includeContext, setIncludeContext] = useState(true);
    const [responseLength, setResponseLength] = useState('medium');
    const [attachedImage, setAttachedImage] = useState(null);

    // New State
    const [currentConversationId, setConversationId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [conversations, setConversations] = useState({});

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load initial state
    useEffect(() => {
        const loadState = async () => {
            const storedConversations = await getConversations();
            setConversations(storedConversations);

            const storedCurrentId = await getCurrentConversationId();
            if (storedCurrentId && storedConversations[storedCurrentId]) {
                setConversationId(storedCurrentId);
                setMessages(storedConversations[storedCurrentId].messages);
            } else {
                startNewChat();
            }
        };
        loadState();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (availableModels.length > 0 && !selectedModel) {
            const defaultModel = availableModels.find(m => m.id === 'openai/gpt-oss-120b') || availableModels[0];
            setSelectedModel(defaultModel.id);
        }
    }, [availableModels, selectedModel]);

    useEffect(() => {
        setAttachedImage(null);
    }, [selectedModel, availableModels]);

    // Save conversation whenever messages change
    useEffect(() => {
        if (currentConversationId && messages.length > 0) {
            const conversation = {
                id: currentConversationId,
                messages: messages,
                title: conversations[currentConversationId]?.title || messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : ''),
                updatedAt: Date.now(),
                isPinned: conversations[currentConversationId]?.isPinned || false
            };
            saveConversation(conversation).then(async () => {
                const updated = await getConversations();
                setConversations(updated);
            });
        }
    }, [messages, currentConversationId]);

    const startNewChat = async () => {
        const newId = crypto.randomUUID();
        setConversationId(newId);
        setMessages([]);
        setInput('');
        setAttachedImage(null);
        await setCurrentConversationId(newId);
        setShowHistory(false);
    };

    const loadConversation = async (id) => {
        const storedConversations = await getConversations();
        if (storedConversations[id]) {
            setConversationId(id);
            setMessages(storedConversations[id].messages);
            await setCurrentConversationId(id);
            setShowHistory(false);
        }
    };

    const handleDeleteConversation = async (id) => {
        await deleteConversation(id);
        const updated = await getConversations();
        setConversations(updated);
        if (id === currentConversationId) {
            startNewChat();
        }
    };

    const handlePinConversation = async (id, isPinned) => {
        await pinConversation(id, isPinned);
        const updated = await getConversations();
        setConversations(updated);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const getPageContext = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return null;

        const sendMessageToTab = async (tabId, message, retries = 3) => {
            try {
                return await chrome.tabs.sendMessage(tabId, message);
            } catch (e) {
                if (retries > 0 && e.message.includes("Receiving end does not exist")) {
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId },
                            files: ['src/content/index.js']
                        });
                        await new Promise(resolve => setTimeout(resolve, 100));
                        return await sendMessageToTab(tabId, message, retries - 1);
                    } catch (injectionError) {
                        console.error("Failed to inject content script", injectionError);
                        throw e;
                    }
                }
                throw e;
            }
        };

        try {
            const response = await sendMessageToTab(tab.id, { action: 'getPageContent' });
            return response?.content;
        } catch (e) {
            console.warn("Could not get page context", e);
            return null;
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleScreenshot = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
                setAttachedImage(dataUrl);
            }
        } catch (e) {
            console.error("Screenshot failed", e);
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachedImage(reader.result);
                };
                reader.readAsDataURL(blob);
                e.preventDefault();
                break;
            }
        }
    };


    const handleSend = async (customInput = null, customContext = null) => {
        const textToSend = customInput || input;
        if (!textToSend.trim() && !attachedImage) return;

        let userContent = textToSend;
        if (attachedImage) {
            userContent = [
                { type: "text", text: textToSend },
                { type: "image_url", image_url: { url: attachedImage } }
            ];
        }

        const userMsg = { role: 'user', content: userContent };
        let contextMsg = null;

        const lengthInstructions = {
            short: "Provide a concise and direct answer. Focus only on the most important information.",
            medium: "Provide a balanced explanation. Include necessary details but avoid excessive elaboration.",
            long: "Provide a comprehensive and detailed response. Cover all relevant aspects and provide in-depth analysis where appropriate."
        };

        const lengthInstruction = lengthInstructions[responseLength] || lengthInstructions.medium;

        if (includeContext || customContext) {
            const pageContent = await getPageContext();
            if (pageContent) {
                contextMsg = {
                    role: 'system',
                    content: `You are a helpful, concise AI assistant living in a Chrome extension.
Answer questions based on the provided page context. If the context is irrelevant to the question, use your general knowledge.
${lengthInstruction}

Context:
${pageContent.substring(0, 10000)}
(End of Context)`
                };
            }
        } else {
            contextMsg = {
                role: 'system',
                content: `You are a helpful, concise AI assistant living in a Chrome extension. ${lengthInstruction}`
            };
        }

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        if (!customInput) {
            setInput('');
            setAttachedImage(null);
        }
        setIsLoading(true);

        try {
            const messagesToSend = contextMsg ? [contextMsg, ...newMessages] : newMessages;

            // Add empty assistant message for streaming
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            const response = await chatCompletion(apiKey, selectedModel, messagesToSend, (chunk) => {
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg.role === 'assistant') {
                        return [
                            ...prev.slice(0, -1),
                            { ...lastMsg, content: lastMsg.content + chunk }
                        ];
                    }
                    return prev;
                });
            });

            // Ensure final state is consistent (though onChunk updates should have handled it)
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                // Only replace if the content is significantly different or if we want to ensure the final object is clean
                // But for streaming, the accumulated state is usually correct.
                // We might just want to ensure the final message object is exactly what we expect.
                return [
                    ...prev.slice(0, -1),
                    response // response is the full message object returned by chatCompletion
                ];
            });

        } catch (error) {
            setMessages(prev => {
                // Remove the empty assistant message if it exists and replace with error
                const lastMsg = prev[prev.length - 1];
                if (lastMsg.role === 'assistant' && lastMsg.content === '') {
                    return [...prev.slice(0, -1), { role: 'assistant', content: `Error: ${error.message}` }];
                }
                // Or just append error
                return [...prev, { role: 'assistant', content: `Error: ${error.message}` }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (action) => {
        let prompt = "";
        switch (action) {
            case 'summarize':
                prompt = "Summarize this page.";
                break;
            case 'explain':
                prompt = "Explain the main concepts on this page.";
                break;
            case 'key_points':
                prompt = "List the key points from this page.";
                break;
            default:
                return;
        }

        setIncludeContext(true);
        handleSend(prompt, true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const currentModel = availableModels.find(m => m.id === selectedModel);

    if (showHistory) {
        return (
            <HistoryView
                conversations={conversations}
                currentId={currentConversationId}
                onSelect={loadConversation}
                onDelete={handleDeleteConversation}
                onPin={handlePinConversation}
                onClose={() => setShowHistory(false)}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Toolbar */}
            <div className="flex flex-col border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10">
                <div className="flex flex-wrap items-center justify-between px-4 py-2 gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHistory(true)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            title="History"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={startNewChat}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            title="New Chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                        <div className="h-4 w-px bg-gray-200 mx-1"></div>
                        <div className="relative">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="appearance-none bg-transparent font-medium text-sm text-gray-700 pr-6 cursor-pointer focus:outline-none"
                                title={selectedModel}
                            >
                                {availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-500">
                                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <select
                            value={responseLength}
                            onChange={(e) => setResponseLength(e.target.value)}
                            className="text-xs bg-gray-100 border-0 rounded-md px-2 py-1 text-gray-600 focus:ring-0 cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                            <option value="short">Short</option>
                            <option value="medium">Medium</option>
                            <option value="long">Long</option>
                        </select>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none group" title="Read Page Context">
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${includeContext ? 'bg-black' : 'bg-gray-200'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${includeContext ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <input
                                type="checkbox"
                                checked={includeContext}
                                onChange={(e) => setIncludeContext(e.target.checked)}
                                className="hidden"
                            />
                            <span className={`text-xs font-medium transition-colors ${includeContext ? 'text-black' : 'text-gray-400'}`}>Context</span>
                        </label>
                    </div>
                </div>


            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards', animationDuration: '0.5s' }}>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">How can I help?</h2>
                        <p className="text-sm text-gray-500 max-w-[240px] mb-8">I can analyze this page, answer questions, or help you write content.</p>

                        <div className="grid grid-cols-1 gap-2 w-full max-w-[240px]">
                            <button
                                onClick={() => handleQuickAction('summarize')}
                                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                            >
                                <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                    </svg>
                                </span>
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">Summarize Page</span>
                            </button>
                            <button
                                onClick={() => handleQuickAction('explain')}
                                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                            >
                                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                    </svg>
                                </span>
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">Explain Concepts</span>
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <MessageBubble key={idx} role={msg.role} content={msg.content} />
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                {/* Quick Chips (only show when there are messages) */}
                {messages.length > 0 && !isLoading && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
                        <button onClick={() => handleQuickAction('summarize')} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all">Summarize</button>
                        <button onClick={() => handleQuickAction('explain')} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all">Explain</button>
                        <button onClick={() => handleQuickAction('key_points')} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all">Key Points</button>
                    </div>
                )}

                {/* Image Preview */}
                {attachedImage && (
                    <div className="relative inline-block mb-3 group">
                        <img src={attachedImage} alt="Attached" className="h-20 w-auto rounded-lg border border-gray-200 shadow-sm" />
                        <button
                            onClick={() => setAttachedImage(null)}
                            className="absolute -top-2 -right-2 bg-white text-gray-500 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-gray-100 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 focus-within:bg-white transition-all shadow-sm">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={undefined}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none rounded-2xl p-3 pr-24 resize-none focus:ring-0 text-sm max-h-32 placeholder:text-gray-400"
                        rows="1"
                        style={{ minHeight: '48px', maxHeight: '20vh' }}
                    />

                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || (!input.trim() && !attachedImage)}
                            className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">AI can make mistakes. Check important info.</p>
                </div>
            </div>
        </div>
    );
};

export default Chat;
