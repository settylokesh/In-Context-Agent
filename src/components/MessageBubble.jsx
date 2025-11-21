import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = ({ role, content }) => {
    const isUser = role === 'user';

    // Handle array content (text + image)
    let textContent = content;
    let imageUrl = null;

    if (Array.isArray(content)) {
        const textPart = content.find(c => c.type === 'text');
        const imagePart = content.find(c => c.type === 'image_url');
        textContent = textPart ? textPart.text : '';
        imageUrl = imagePart ? imagePart.image_url.url : null;
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
            {!isUser && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
                    </svg>
                </div>
            )}

            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${isUser
                    ? 'bg-black text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}
            >
                {imageUrl && (
                    <img src={imageUrl} alt="User uploaded" className="rounded-lg mb-2 max-h-48 w-auto border border-white/20" />
                )}
                <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''} prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
