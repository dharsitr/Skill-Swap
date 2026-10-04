import { Conversation, ChatMessage } from "@/types";

let conversationsStore: Conversation[] = [];

export const messageService = {
  async getConversations(): Promise<Conversation[]> {
    return Promise.resolve([...conversationsStore]);
  },

  async sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
    };

    conversationsStore = conversationsStore.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: text,
          lastMessageTime: "Just now",
          messages: [...c.messages, userMsg],
        };
      }
      return c;
    });

    return Promise.resolve(userMsg);
  },
};
