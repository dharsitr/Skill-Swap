"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Send, Video } from "lucide-react";

export default function MessagesPage() {
  const { conversations, sendMessage, showToast } = useApp();
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || "conv-alex");
  const [messageInput, setMessageInput] = useState<string>("");
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const activeConversation = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleSend = () => {
    if (messageInput.trim()) {
      sendMessage(activeConversation.id, messageInput);
      setMessageInput("");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Messages & Swap Chat"
        description="Coordinate session agendas and exchange resources with your peers."
      />

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 h-[560px] overflow-hidden">
        {/* Conversation List */}
        <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
            <span>Conversations</span>
            <Badge variant="indigo" size="sm">{conversations.length}</Badge>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected ? "bg-white border-l-4 border-indigo-600 shadow-xs" : "hover:bg-slate-100/70"
                  }`}
                >
                  <Avatar src={conv.peerAvatar} size="md" isOnline={true} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{conv.peerName}</span>
                      <span className="text-[10px] text-slate-400">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Chat Thread */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {/* Thread Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Avatar src={activeConversation.peerAvatar} size="sm" isOnline={true} />
              <div>
                <div className="text-xs font-bold text-slate-900">{activeConversation.peerName}</div>
                <div className="text-[10px] text-slate-400">{activeConversation.peerRole}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVideoModalOpen(true)}
            >
              <Video className="h-3.5 w-3.5 mr-1" />
              Start Video
            </Button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {activeConversation.messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-xs ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-slate-100 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`text-[9px] block mt-1 ${
                        isUser ? "text-indigo-200 text-right" : "text-slate-400"
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${activeConversation.peerName}...`}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              className="font-bold"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Call Modal */}
      <Modal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        title="Interactive 1-on-1 Video Room"
        description={`Connecting to call room with ${activeConversation.peerName}...`}
      >
        <div className="space-y-4 text-center py-4">
          <div className="h-20 w-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
            <Video className="h-10 w-10 animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Room Ready to Join</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Your camera and microphone will activate once connected.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => setVideoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setVideoModalOpen(false);
                showToast("Entering video call room... (Backend simulated)");
              }}
            >
              Enter Room
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
