import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SignalingMessage, SignalingPayload } from '@/types/webrtc';

export type SignalingCallback = (message: SignalingMessage) => void;

export class SignalingService {
  private channel: RealtimeChannel | null = null;
  private sessionId: string;
  private userId: string;
  private onMessageCallback: SignalingCallback | null = null;
  private isSubscribed: boolean = false;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  public setOnMessageCallback(callback: SignalingCallback): void {
    this.onMessageCallback = callback;
  }

  public async subscribe(): Promise<void> {
    if (this.channel) {
      await this.unsubscribe();
    }

    const channelName = `session:${this.sessionId}:webrtc`;

    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false,
          ack: false,
        },
      },
    });

    this.channel
      .on('broadcast', { event: 'signal' }, (payload: { payload: SignalingMessage }) => {
        const message = payload.payload;
        if (!message || message.sessionId !== this.sessionId) return;
        // Ignore self broadcasts just in case
        if (message.payload.senderId === this.userId) return;

        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isSubscribed = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.isSubscribed = false;
        }
      });
  }

  public async sendSignal(
    type: SignalingMessage['type'],
    payload: Omit<SignalingPayload, 'senderId' | 'timestamp'>
  ): Promise<void> {
    if (!this.channel) {
      console.warn('Cannot send signal, Realtime channel is not initialized.');
      return;
    }

    const fullPayload: SignalingPayload = {
      ...payload,
      senderId: this.userId,
      timestamp: new Date().toISOString(),
    };

    const message: SignalingMessage = {
      type,
      sessionId: this.sessionId,
      payload: fullPayload,
    };

    await this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: message,
    });
  }

  public async unsubscribe(): Promise<void> {
    if (this.channel) {
      try {
        await supabase.removeChannel(this.channel);
      } catch (err) {
        console.error('Error unsubscribing signaling channel:', err);
      } finally {
        this.channel = null;
        this.isSubscribed = false;
      }
    }
  }

  public getChannelStatus(): boolean {
    return this.isSubscribed;
  }
}
