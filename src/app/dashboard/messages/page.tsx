"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  chatService,
  settingsService,
  ChatMessage,
  ConversationWithDetails,
} from "@/lib/supabase/services";

import {
  Send,
  Search,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Check,
  CheckCheck,
  Compass,
  User,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  if (diffHours < 48 && date.getDate() === now.getDate() - 1) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useApp();

  // Conversations state
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);

  // Active messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Mobile layout state: show list or thread
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  // Read receipts preference state (Phase 17)
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);

  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch conversations for logged-in user
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setIsLoadingConvs(true);
    try {
      const res = await chatService.getUserConversations(user.id);
      if (res.data) {
        setConversations(res.data);

        // If no conversation selected yet, pick first
        if (!activeConvId && res.data.length > 0 && !targetUserId) {
          setActiveConvId(res.data[0].id);
        }
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingConvs(false);
    }
  }, [user, activeConvId, targetUserId]);

  // 2. Handle targetUserId query param (e.g. from Session details or Discover)
  useEffect(() => {
    if (!user || !targetUserId || authLoading) return;

    let isMounted = true;
    chatService.getOrCreateConversation(user.id, targetUserId).then((res) => {
      if (isMounted && res.data) {
        setActiveConvId(res.data);
        setMobileView("thread");
        loadConversations();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, targetUserId, authLoading, loadConversations]);

  useEffect(() => {
    if (user && !authLoading) {
      loadConversations();
      settingsService.getUserPreferences(user.id).then((res) => {
        if (res.data) {
          setReadReceiptsEnabled(res.data.read_receipts_enabled);
        }
      });
    }
  }, [user, authLoading, loadConversations]);


  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || null;
  }, [conversations, activeConvId]);

  // 3. Load messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId || !user) return;

    setIsLoadingMessages(true);
    setSendError(null);

    chatService.getConversationMessages(activeConvId).then((res) => {
      if (res.data) {
        setMessages(res.data);
        setTimeout(scrollToBottom, 50);
      }
      setIsLoadingMessages(false);
    });

    // Mark as read in background
    chatService.markConversationAsRead(activeConvId, user.id).then(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
      );
    });
  }, [activeConvId, user]);

  // 4. Realtime subscription for active conversation
  useEffect(() => {
    if (!activeConvId || !user) return;

    const unsubscribe = chatService.subscribeToConversation(activeConvId, {
      onNewMessage: (newMsg) => {
        setMessages((prev) => {
          // Prevent duplicates (e.g. from optimistic send)
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Update lastMessage preview in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  lastMessage: newMsg,
                  updatedAt: newMsg.created_at,
                }
              : c
          )
        );

        // If not sent by me, mark as read
        if (newMsg.sender_id !== user.id) {
          chatService.markConversationAsRead(activeConvId, user.id);
        }

        setTimeout(scrollToBottom, 50);
      },
      onMessageUpdated: (updMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updMsg.id ? { ...m, ...updMsg } : m))
        );
      },
    });

    return () => {
      unsubscribe();
    };
  }, [activeConvId, user]);

  // 5. Send Message handler with Optimistic UI
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = messageInput.trim();
    if (!content || !activeConvId || !user || isSending) return;

    setIsSending(true);
    setSendError(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_at: null,
      sender: null,
    };

    // Optimistic append
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageInput("");
    setTimeout(scrollToBottom, 50);

    try {
      const res = await chatService.sendMessage(activeConvId, user.id, content);
      if (res.error) {
        setSendError(res.error);
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setMessageInput(content);
      } else if (res.data) {
        // Replace temp message with server message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.data! : m))
        );
        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, lastMessage: res.data, updatedAt: res.data!.created_at }
              : c
          )
        );
      }
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessageInput(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filtered conversation list by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.peer.display_name?.toLowerCase().includes(q) ||
        c.peer.username?.toLowerCase().includes(q) ||
        c.lastMessage?.content.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Messages & Swap Chat"
        description="Coordinate 1-on-1 session agendas and exchange skill knowledge in real time."
      />

      {/* Main Chat Frame */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 h-[620px] overflow-hidden">
        {/* ===================== LEFT: CONVERSATION LIST ===================== */}
        <div
          className={`border-r border-slate-200 flex flex-col h-full bg-slate-50/50 ${
            mobileView === "thread" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header & Search */}
          <div className="p-3.5 border-b border-slate-200 space-y-3 bg-white">
            <div className="flex items-center justify-between font-bold text-sm text-slate-900">
              <span>Conversations</span>
              <Badge variant="indigo" size="sm">
                {conversations.length}
              </Badge>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* List or Empty State */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {isLoadingConvs ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-24 h-3 bg-slate-200 rounded" />
                      <div className="w-36 h-2.5 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                const peerName = conv.peer.display_name || conv.peer.username || "Peer";

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setMobileView("thread");
                    }}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-white border-l-4 border-indigo-600 shadow-xs"
                        : "hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={conv.peer.avatar_url || undefined}
                        alt={peerName}
                        size="md"
                        isOnline={true}
                      />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {peerName}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-400">
                            {formatMessageTime(conv.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          conv.unreadCount > 0
                            ? "font-semibold text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">No chats found</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                    Connect with mentors on Discover to initiate 1-on-1 swap chats.
                  </p>
                </div>
                <Link href="/dashboard/discover">
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    <Compass className="h-3 w-3 mr-1" />
                    Discover Mentors
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ===================== RIGHT: ACTIVE THREAD ===================== */}
        <div
          className={`md:col-span-2 flex flex-col h-full bg-white ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* Thread Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <Avatar
                    src={activeConversation.peer.avatar_url || undefined}
                    alt={activeConversation.peer.display_name || "Peer"}
                    size="sm"
                    isOnline={true}
                  />

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {activeConversation.peer.display_name || "Community Member"}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {activeConversation.peer.headline || `@${activeConversation.peer.username || "user"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/discover`}>
                    <Button variant="ghost" size="sm" className="text-xs font-medium text-slate-600">
                      <User className="h-3.5 w-3.5 mr-1" />
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-br-xs"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        </div>

                        {/* Timestamp & Delivery status */}
                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400">
                          <span>{formatMessageTime(m.created_at)}</span>
                          {isMe && (
                            <span>
                              {m.id.startsWith("temp-") ? (
                                <Clock className="h-2.5 w-2.5 inline" />
                              ) : m.read_at && readReceiptsEnabled ? (
                                <CheckCheck className="h-3 w-3 inline text-indigo-600" />
                              ) : (
                                <Check className="h-2.5 w-2.5 inline text-slate-400" />
                              )}
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Start the conversation</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Say hello, introduce yourself, or share what skill you want to learn or teach!
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Banner */}
              {sendError && (
                <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{sendError}</span>
                  <button
                    onClick={() => setSendError(null)}
                    className="text-[10px] font-bold underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 bg-white flex items-end gap-2 flex-shrink-0"
              >
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white resize-none max-h-24 transition-all"
                  />
                  {messageInput.length > 2500 && (
                    <span className="absolute right-2 bottom-1.5 text-[10px] text-slate-400">
                      {3000 - messageInput.length} left
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!messageInput.trim() || isSending}
                  className="rounded-xl px-3.5 py-2.5 font-bold shadow-xs flex-shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Select a Conversation</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Choose a chat from the sidebar or connect with mentors from Discover to exchange skills.
                </p>
              </div>
              <Link href="/dashboard/discover">
                <Button variant="outline" size="sm" className="font-semibold text-xs mt-2">
                  <Compass className="h-3.5 w-3.5 mr-1" />
                  Explore Mentors
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
