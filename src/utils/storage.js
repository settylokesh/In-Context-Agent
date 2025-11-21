/**
 * Storage utility for managing chat conversations
 */

const STORAGE_KEYS = {
    CONVERSATIONS: 'groq_conversations',
    CURRENT_CONVERSATION_ID: 'groq_current_conversation_id'
};

export const getConversations = async () => {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CONVERSATIONS);
    return result[STORAGE_KEYS.CONVERSATIONS] || {};
};

export const saveConversation = async (conversation) => {
    const conversations = await getConversations();
    conversations[conversation.id] = {
        ...conversation,
        updatedAt: Date.now()
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.CONVERSATIONS]: conversations });
};

export const deleteConversation = async (id) => {
    const conversations = await getConversations();
    delete conversations[id];
    await chrome.storage.local.set({ [STORAGE_KEYS.CONVERSATIONS]: conversations });
};

export const getCurrentConversationId = async () => {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
    return result[STORAGE_KEYS.CURRENT_CONVERSATION_ID];
};

export const setCurrentConversationId = async (id) => {
    await chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_CONVERSATION_ID]: id });
};

export const clearCurrentConversationId = async () => {
    await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
};

export const pinConversation = async (id, isPinned) => {
    const conversations = await getConversations();
    if (conversations[id]) {
        conversations[id].isPinned = isPinned;
        await chrome.storage.local.set({ [STORAGE_KEYS.CONVERSATIONS]: conversations });
    }
};
