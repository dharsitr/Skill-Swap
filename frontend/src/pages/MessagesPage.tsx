import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import {
  useConversations,
  useConversation,
  useMessages,
  useSendChatMessage,
  useMarkChatRead,
  useChatSocket,
} from '@/hooks/useChat';
import { useBlockStatus } from '@/hooks/useSafety';
import { useCurrentProfile } from '@/hooks/useProfile';
import { BlockModal } from '@/components/safety/BlockModal';
import { ReportModal } from '@/components/safety/ReportModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  ArrowLeft,
  Building,
  Sparkles,
  WifiOff,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Ban,
  UserCheck,
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentProfile } = useCurrentProfile();

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversationsData,
    isLoading: convsLoading,
  } = useConversations({ page: 0, size: 50 });

  const activeConvId = conversationId || (conversationsData?.items?.[0]?.id);

  const {
    data: activeConversation,
  } = useConversation(activeConvId || '');

  const currentConversation = activeConversation || conversationsData?.items?.find((c) => c.id === activeConvId);

  const { data: blockStatus, refetch: refetchBlockStatus } = useBlockStatus(
    currentConversation?.otherParticipant.userId || ''
  );

  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useMessages(activeConvId || '', { page: 0, size: 100 });

  const sortedMessages = React.useMemo(() => {
    if (!messagesData?.items) return [];
    return [...messagesData.items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messagesData?.items]);

  const { mutateAsync: sendMessage, isPending: isSending } = useSendChatMessage();
  const { mutate: markRead } = useMarkChatRead();
  const { connectionStatus, isOtherUserTyping, sendTyping } = useChatSocket(
    activeConvId,
    currentConversation?.otherParticipant?.userId
  );

  // Mark conversation as read on open
  useEffect(() => {
    if (activeConvId) {
      markRead(activeConvId);
    }
  }, [activeConvId, markRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [sortedMessages, isOtherUserTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Typing event throttling
    sendTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(
      setTimeout(() => {
        sendTyping(false);
      }, 2000)
    );
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || !activeConvId) return;

    const content = inputText.trim();
    setInputText('');
    sendTyping(false);

    try {
      await sendMessage({
        conversationId: activeConvId,
        content,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore input on failure
      setInputText(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const filteredConversations = conversationsData?.items.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.otherParticipant.displayName.toLowerCase().includes(q) ||
      conv.otherParticipant.collegeName.toLowerCase().includes(q) ||
      (conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(q))
    );
  });

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#10B981] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            Live
          </span>
        );
      case 'CONNECTING':
      case 'RECONNECTING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#F59E0B] font-semibold">
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            Reconnecting
          </span>
        );
      case 'DISCONNECTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
            <WifiOff className="w-2.5 h-2.5" />
            Offline
          </span>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1 text-[10px]">
              <MessageSquare className="w-3 h-3 text-[#10B981]" />
              Real-Time Chat
            </Badge>
            {getConnectionBadge()}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8F5ED] mt-1 font-display">
            Direct Messaging
          </h1>
        </div>
      </div>

      {/* Main Chat Grid (Sidebar + Active Chat Room) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 rounded-2xl bg-[#111827] border border-[rgba(212,175,106,0.18)] shadow-2xl overflow-hidden">
        {/* ================================================================= */}
        {/* CONVERSATION LIST (LEFT PANEL) */}
        {/* ================================================================= */}
        <div
          className={`flex flex-col border-r border-slate-800 bg-[#0E1522] ${
            conversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search box */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#111827] border border-[#334155] rounded-xl text-[#F8F5ED] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981] transition-colors"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {convsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-[#1E293B]" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-[#1E293B] rounded w-24" />
                      <div className="h-2.5 bg-[#1E293B]/60 rounded w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations && filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const hasUnread = (conv.unreadCount || 0) > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                      isActive
                        ? 'bg-[#1E293B] border-l-2 border-l-[#10B981]'
                        : 'hover:bg-[#1E293B]/50'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#F8F5ED] font-bold text-sm overflow-hidden">
                        {conv.otherParticipant.avatarUrl ? (
                          <img
                            src={conv.otherParticipant.avatarUrl}
                            alt={conv.otherParticipant.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          conv.otherParticipant.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#0B1220]" />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#F8F5ED]' : 'text-[#CBD5E1]'}`}>
                          {conv.otherParticipant.displayName}
                        </p>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-[#94A3B8] shrink-0">
                            {formatMessageTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#94A3B8] truncate flex items-center gap-1 mt-0.5">
                        <Building className="w-2.5 h-2.5 text-[#10B981] shrink-0" />
                        {conv.otherParticipant.collegeName}
                      </p>

                      <p className={`text-xs truncate mt-1 ${hasUnread ? 'font-semibold text-[#F8F5ED]' : 'text-[#64748B]'}`}>
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {hasUnread && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#10B981] text-[#06131A] self-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[#94A3B8] space-y-2">
                <MessageSquare className="w-6 h-6 mx-auto text-[#64748B]" />
                <p>No conversations found</p>
                <Link to="/discover">
                  <Button variant="default" size="sm" className="mt-2 text-xs h-7 px-3">
                    Find Peers
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* ACTIVE CHAT WINDOW (RIGHT PANEL) */}
        {/* ================================================================= */}
        <div
          className={`md:col-span-2 lg:col-span-3 flex flex-col bg-[#111827] ${
            !conversationId && !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {currentConversation ? (
            <>
              {/* Chat Room Header */}
              <div className="p-3.5 px-4 sm:px-6 border-b border-slate-800 bg-[#0E1522] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => navigate('/messages')}
                    className="md:hidden p-1.5 rounded-lg hover:bg-[#1E293B] text-[#94A3B8]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-9 h-9 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-[#F8F5ED] font-bold text-sm overflow-hidden shrink-0">
                    {currentConversation.otherParticipant.avatarUrl ? (
                      <img
                        src={currentConversation.otherParticipant.avatarUrl}
                        alt={currentConversation.otherParticipant.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentConversation.otherParticipant.displayName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-xs sm:text-sm text-[#F8F5ED] truncate font-display">
                        {currentConversation.otherParticipant.displayName}
                      </h2>
                      <Link
                        to={`/users/${currentConversation.otherParticipant.userId}`}
                        className="text-[#94A3B8] hover:text-[#10B981]"
                        title="View Profile"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] flex items-center gap-1 truncate">
                      <Building className="w-2.5 h-2.5 text-[#10B981]" />
                      {currentConversation.otherParticipant.collegeName}
                      {currentConversation.otherParticipant.department && (
                        <span>• {currentConversation.otherParticipant.department}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBlockModalOpen(true)}
                    title={blockStatus?.blockedByMe ? 'Unblock Student' : 'Block Student'}
                    className={`h-8 px-2 text-xs ${
                      blockStatus?.blockedByMe
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    {blockStatus?.blockedByMe ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    title="Report Student"
                    className="h-8 px-2 text-xs text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5 bg-[#0B1220]/40">
                {messagesLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-12 w-48 rounded-2xl ${
                          n % 2 === 0
                            ? 'ml-auto bg-[#064E3B]/40'
                            : 'mr-auto bg-[#1E293B]'
                        }`}
                      />
                    ))}
                  </div>
                ) : sortedMessages.length > 0 ? (
                  sortedMessages.map((msg) => {
                    const emailPrefix = user?.email?.split('@')[0] || '';
                    const otherUserId = currentConversation?.otherParticipant?.userId;
                    const myProfileUserId = currentProfile?.userId;
                    const myAuthId = user?.id;

                    const isMine = Boolean(
                      (myProfileUserId && msg.senderId === myProfileUserId) ||
                      (myAuthId && msg.senderId === myAuthId) ||
                      (otherUserId && msg.senderId !== otherUserId) ||
                      (currentProfile?.displayName && msg.senderName === currentProfile.displayName) ||
                      (emailPrefix.length > 0 && msg.senderName.toLowerCase().includes(emailPrefix.toLowerCase()))
                    );

                    const isSeen = Boolean(
                      msg.readAt ||
                      (currentConversation?.otherParticipant?.lastReadAt &&
                        new Date(currentConversation.otherParticipant.lastReadAt) >= new Date(msg.createdAt))
                    );

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3 px-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isMine
                              ? 'bg-[#064E3B] text-[#F8F5ED] rounded-br-none border border-[#10B981]/30'
                              : 'bg-[#1E293B] text-[#F8F5ED] rounded-bl-none border border-[#334155]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>

                        <div className={`flex items-center gap-1.5 text-[10px] text-[#94A3B8] mt-1 px-1 ${isMine ? 'justify-end' : ''}`}>
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {isMine && (
                            <span className="inline-flex items-center gap-0.5 ml-1">
                              {isSeen ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[#10B981] font-semibold"
                                  title={msg.readAt ? `Seen at ${formatMessageTime(msg.readAt)}` : 'Seen'}
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Seen</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[#94A3B8]"
                                  title="Sent"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#64748B]" />
                                  <span>Sent</span>
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-[#94A3B8]">
                    <Sparkles className="w-8 h-8 text-[#10B981]/40" />
                    <p className="text-xs font-semibold text-[#F8F5ED]">No messages yet</p>
                    <p className="text-[11px] max-w-xs">
                      Say hello to {currentConversation.otherParticipant.displayName} and coordinate your skill exchange!
                    </p>
                  </div>
                )}

                {/* Typing Indicator */}
                {isOtherUserTyping && (
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8] animate-in fade-in">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[11px]">{currentConversation.otherParticipant.displayName} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer / Blocked Banner */}
              {blockStatus?.blockedByMe ? (
                <div className="p-4 border-t border-slate-800 bg-[#0E1522] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Ban className="w-4 h-4 text-red-400 shrink-0" />
                    <span>You have blocked this student. Unblock them to resume chatting.</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBlockModalOpen(true)}
                    className="text-xs h-7 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                  >
                    Unblock
                  </Button>
                </div>
              ) : blockStatus?.blockedByTarget ? (
                <div className="p-4 border-t border-slate-800 bg-[#0E1522] flex items-center gap-2 text-xs text-neutral-400">
                  <Ban className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>You cannot message this student due to privacy settings.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-800 bg-[#0E1522]">
                  <div className="relative flex items-end gap-2">
                    <textarea
                      rows={1}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      maxLength={2000}
                      placeholder="Type a message (Press Enter to send, Shift+Enter for newline)..."
                      className="flex-1 max-h-32 min-h-[42px] p-2.5 px-4 text-xs sm:text-sm bg-[#111827] border border-[#334155] rounded-xl text-[#F8F5ED] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 resize-none transition-colors"
                    />

                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                      disabled={!inputText.trim() || isSending}
                      className="h-[42px] px-4 text-xs font-semibold gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#94A3B8] mt-1.5 px-1">
                    <span>Press Enter to send</span>
                    <span>{inputText.length} / 2000</span>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-slate-700/60 text-[#10B981] flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-[#F8F5ED]">Select a Conversation</h3>
              <p className="text-xs text-[#94A3B8] max-w-xs">
                Choose a peer from the left sidebar to start coordinating skill sessions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Safety Modals */}
      {currentConversation && (
        <>
          <BlockModal
            isOpen={blockModalOpen}
            userId={currentConversation.otherParticipant.userId}
            userName={currentConversation.otherParticipant.displayName}
            isCurrentlyBlocked={Boolean(blockStatus?.blockedByMe)}
            onClose={() => setBlockModalOpen(false)}
            onSuccess={() => refetchBlockStatus()}
          />

          <ReportModal
            isOpen={reportModalOpen}
            reportedUserId={currentConversation.otherParticipant.userId}
            reportedUserName={currentConversation.otherParticipant.displayName}
            onClose={() => setReportModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
