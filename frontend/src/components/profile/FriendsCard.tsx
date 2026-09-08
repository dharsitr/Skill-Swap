import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useFriendsList,
  useIncomingFriendRequests,
  useOutgoingFriendRequests,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
} from '@/hooks/useFriends';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserPlus,
  Clock,
  MessageSquare,
  Check,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const FriendsCard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'friends' | 'incoming' | 'outgoing'>('friends');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: friends = [], isLoading: loadingFriends } = useFriendsList();
  const { data: incoming = [], isLoading: loadingIncoming } = useIncomingFriendRequests();
  const { data: outgoing = [], isLoading: loadingOutgoing } = useOutgoingFriendRequests();

  const { mutateAsync: acceptRequest } = useAcceptFriendRequest();
  const { mutateAsync: declineRequest } = useDeclineFriendRequest();
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelFriendRequest();
  const { mutate: removeFriend, isPending: isRemoving } = useRemoveFriend();

  const handleAccept = async (reqId: string, senderName: string) => {
    setAcceptingId(reqId);
    setStatusMessage(null);
    try {
      await acceptRequest(reqId);
      setStatusMessage({
        type: 'success',
        text: `You and ${senderName} are now campus friends! You can now chat directly.`,
      });
      // Switch automatically to friends tab so the user sees their new friend immediately
      setActiveTab('friends');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to accept request. Please restart the backend server if running locally.',
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (reqId: string) => {
    setDecliningId(reqId);
    setStatusMessage(null);
    try {
      await declineRequest(reqId);
      setStatusMessage({
        type: 'success',
        text: 'Friend request declined.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to decline request.',
      });
    } finally {
      setDecliningId(null);
    }
  };

  const handleOpenChat = (conversationId?: string | null) => {
    if (conversationId) {
      navigate(`/messages/${conversationId}`);
    } else {
      navigate('/messages');
    }
  };

  return (
    <Card className="glass-card border-slate-800 bg-[#111827]/70 overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#F8F5ED]">Campus Friends & Connections</CardTitle>
              <CardDescription className="text-xs text-[#94A3B8]">
                Connect with peers on campus to unlock direct messaging
              </CardDescription>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-[#1E293B] p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('friends');
                setStatusMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'friends'
                  ? 'bg-[#10B981]/20 text-[#34D399] font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8F5ED]'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('incoming');
                setStatusMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all relative ${
                activeTab === 'incoming'
                  ? 'bg-[#10B981]/20 text-[#34D399] font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8F5ED]'
              }`}
            >
              Requests ({incoming.length})
              {incoming.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-1 animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('outgoing');
                setStatusMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'outgoing'
                  ? 'bg-[#10B981]/20 text-[#34D399] font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8F5ED]'
              }`}
            >
              Sent ({outgoing.length})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {/* Status Alert Banner */}
        {statusMessage && (
          <Alert
            variant={statusMessage.type === 'success' ? 'default' : 'destructive'}
            className={`py-2 px-3 text-xs border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <AlertDescription className="text-xs">{statusMessage.text}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ACCEPTED FRIENDS */}
        {/* ========================================================================= */}
        {activeTab === 'friends' && (
          <div>
            {loadingFriends ? (
              <div className="py-8 text-center text-xs text-neutral-400 animate-pulse">
                Loading friends list...
              </div>
            ) : friends.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-slate-800 text-neutral-400 flex items-center justify-center mx-auto">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#F8F5ED]">No friends connected yet</h4>
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                    Visit student profiles in the Discover catalog and send a friend request to start chatting!
                  </p>
                </div>
                <Link to="/discover">
                  <Button variant="outline" size="sm" className="text-xs mt-2 border-slate-700">
                    Discover Students
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends.map((friend) => (
                  <div
                    key={friend.friendRequestId}
                    className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <Link
                      to={`/profile/${friend.userId}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] font-bold text-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.displayName} className="w-full h-full object-cover" />
                        ) : (
                          friend.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#F8F5ED] truncate group-hover:text-emerald-400 transition-colors">
                          {friend.displayName}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] truncate">
                          {friend.collegeName || 'Campus Peer'}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenChat(friend.conversationId)}
                        className="h-7 px-2.5 text-xs gap-1 font-semibold"
                        title="Chat on messages"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFriend(friend.userId)}
                        disabled={isRemoving}
                        title="Remove friend"
                        className="w-7 h-7 text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INCOMING FRIEND REQUESTS */}
        {/* ========================================================================= */}
        {activeTab === 'incoming' && (
          <div>
            {loadingIncoming ? (
              <div className="py-8 text-center text-xs text-neutral-400 animate-pulse">
                Loading incoming requests...
              </div>
            ) : incoming.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#94A3B8] italic">
                No pending incoming friend requests.
              </div>
            ) : (
              <div className="space-y-2.5">
                {incoming.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <Link
                      to={`/profile/${req.senderId}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm overflow-hidden shrink-0">
                        {req.senderAvatarUrl ? (
                          <img src={req.senderAvatarUrl} alt={req.senderName} className="w-full h-full object-cover" />
                        ) : (
                          req.senderName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#F8F5ED] truncate group-hover:text-sky-400 transition-colors">
                          {req.senderName}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] truncate">
                          {req.senderCollege || 'Student'} • Wants to connect
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleAccept(req.id, req.senderName)}
                        disabled={acceptingId === req.id || decliningId === req.id}
                        className="h-7 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 font-semibold shadow-sm"
                      >
                        {acceptingId === req.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Accepting...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Accept</span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecline(req.id)}
                        disabled={acceptingId === req.id || decliningId === req.id}
                        className="h-7 px-2 text-xs text-neutral-400 hover:text-red-400 border-slate-700"
                      >
                        {decliningId === req.id ? 'Declining...' : 'Decline'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: OUTGOING SENT REQUESTS */}
        {/* ========================================================================= */}
        {activeTab === 'outgoing' && (
          <div>
            {loadingOutgoing ? (
              <div className="py-8 text-center text-xs text-neutral-400 animate-pulse">
                Loading sent requests...
              </div>
            ) : outgoing.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#94A3B8] italic">
                No outgoing friend requests pending.
              </div>
            ) : (
              <div className="space-y-2.5">
                {outgoing.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-[#1E293B]/70 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <Link
                      to={`/profile/${req.receiverId}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm overflow-hidden shrink-0">
                        {req.receiverAvatarUrl ? (
                          <img src={req.receiverAvatarUrl} alt={req.receiverName} className="w-full h-full object-cover" />
                        ) : (
                          req.receiverName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#F8F5ED] truncate group-hover:text-amber-400 transition-colors">
                          {req.receiverName}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] truncate">
                          {req.receiverCollege || 'Student'} • Awaiting acceptance
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="warning" className="text-[10px] gap-1 py-0.5">
                        <Clock className="w-3 h-3" />
                        Pending
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelRequest(req.id)}
                        disabled={isCancelling}
                        className="h-7 px-2 text-xs text-neutral-400 hover:text-red-400"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
