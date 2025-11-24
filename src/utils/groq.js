

export const chatCompletion = async (apiKey, model, messages, onChunk = null) => {
    try {
        const sanitizedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const isStreaming = typeof onChunk === 'function';

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: sanitizedMessages,
                stream: isStreaming
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get completion');
        }

        if (isStreaming) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullContent = "";
            let role = "assistant";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

                    if (trimmedLine.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(trimmedLine.slice(6));
                            const delta = data.choices[0].delta;
                            if (delta.content) {
                                fullContent += delta.content;
                                onChunk(delta.content);
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk", e);
                        }
                    }
                }
            }
            return { role, content: fullContent };
        } else {
            const data = await response.json();
            return data.choices[0].message;
        }
    } catch (error) {
        console.error('Error in chat completion:', error);
        throw error;
    }
};
