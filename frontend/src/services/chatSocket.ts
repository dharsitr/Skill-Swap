import type { ChatConnectionState, ChatWebSocketMessage } from '@/types/api';

type MessageListener = (message: ChatWebSocketMessage) => void;
type StatusListener = (status: ChatConnectionState) => void;

class ChatSocketClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private messageListeners = new Set<MessageListener>();
  private statusListeners = new Set<StatusListener>();
  private status: ChatConnectionState = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private isIntentionallyClosed = false;

  private getWebSocketUrl(token: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.host in browser or fallback to localhost:8081
    const host = window.location.port === '5173' ? 'localhost:8081' : window.location.host;
    return `${protocol}//${host}/ws/chat?token=${encodeURIComponent(token)}`;
  }

  public connect(token: string) {
    if (!token) return;
    this.token = token;
    this.isIntentionallyClosed = false;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('CONNECTING');

    try {
      const url = this.getWebSocketUrl(token);
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
      };

      this.socket.onmessage = (event) => {
        try {
          const data: ChatWebSocketMessage = JSON.parse(event.data);
          this.messageListeners.forEach((listener) => listener(data));
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
      };

      this.socket.onclose = () => {
        this.socket = null;
        if (!this.isIntentionallyClosed) {
          this.setStatus('DISCONNECTED');
          this.scheduleReconnect();
        } else {
          this.setStatus('DISCONNECTED');
        }
      };

    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      this.setStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('DISCONNECTED');
  }

  private scheduleReconnect() {
    if (this.isIntentionallyClosed || !this.token) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('DISCONNECTED');
      return;
    }

    this.setStatus('RECONNECTING');
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.isIntentionallyClosed && this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  public sendMessage(conversationId: string, content: string, clientMessageId?: string) {
    this.sendPayload({
      type: 'SEND_MESSAGE',
      conversationId,
      content,
      clientMessageId: clientMessageId || `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    });
  }

  public markRead(conversationId: string) {
    this.sendPayload({
      type: 'MARK_READ',
      conversationId,
    });
  }

  public sendTyping(conversationId: string, isTyping: boolean) {
    this.sendPayload({
      type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
      conversationId,
    });
  }

  private sendPayload(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  public onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public getStatus(): ChatConnectionState {
    return this.status;
  }

  private setStatus(newStatus: ChatConnectionState) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => listener(newStatus));
  }
}

export const chatSocket = new ChatSocketClient();
