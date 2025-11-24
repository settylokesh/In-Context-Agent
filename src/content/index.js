

import { Readability } from '@mozilla/readability';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
        try {
            const documentClone = document.cloneNode(true);
            const article = new Readability(documentClone).parse();

            if (article && article.textContent) {
                // Token optimization: Remove excessive whitespace
                const cleanText = article.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

                sendResponse({ content: cleanText });
            } else {
                // Fallback if Readability fails
                sendResponse({ content: document.body.innerText.replace(/\s+/g, ' ').trim() });
            }
        } catch (e) {
            console.error("Readability failed", e);
            sendResponse({ content: document.body.innerText.replace(/\s+/g, ' ').trim() });
        }
    }
});
