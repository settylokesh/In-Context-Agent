

export const chatCompletion = async (apiKey, model, messages) => {
    try {

        const sanitizedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: sanitizedMessages,
                stream: false
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get completion');
        }
        const data = await response.json();
        return data.choices[0].message;
    } catch (error) {
        console.error('Error in chat completion:', error);
        throw error;
    }
};
