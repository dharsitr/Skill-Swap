import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessagesPage } from '@/pages/MessagesPage';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthContext';
import { authService } from '@/auth/authService';
import { chatService } from '@/services/chatService';
import type { Conversation, ChatMessage } from '@/types/api';



vi.mock('@/auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/services/chatService', () => ({
  chatService: {
    getOrCreateConversation: vi.fn(),
    getConversations: vi.fn(),
    getConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markRead: vi.fn(),
    getUnreadCount: vi.fn(),
  },
}));

vi.mock('@/services/profileService', () => ({
  profileService: {
    getCurrentProfile: vi.fn().mockResolvedValue({
      id: 'prof-1',
      userId: 'usr-1',
      displayName: 'Alice Student',
      collegeName: 'MIT',
      department: 'CS',
      yearOfStudy: 'THIRD_YEAR',
    }),
    updateProfile: vi.fn(),
  },
}));

vi.mock('@/services/chatSocket', () => ({
  chatSocket: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendMessage: vi.fn(),
    markRead: vi.fn(),
    sendTyping: vi.fn(),
    onMessage: vi.fn().mockReturnValue(() => {}),
    onStatusChange: vi.fn().mockImplementation((cb) => {
      cb('CONNECTED');
      return () => {};
    }),
    getStatus: vi.fn().mockReturnValue('CONNECTED'),
  },
}));

describe('MessagesPage Component', () => {
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      otherParticipant: {
        userId: 'usr-2',
        displayName: 'Bob Tutor',
        collegeName: 'Stanford',
        department: 'CS',
      },
      lastMessage: {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'usr-2',
        senderName: 'Bob Tutor',
        content: 'Hi Alice! Let us coordinate our session.',
        createdAt: '2026-08-29T11:00:00Z',
      },
      lastMessageAt: '2026-08-29T11:00:00Z',
      unreadCount: 1,
      createdAt: '2026-08-29T10:00:00Z',
      updatedAt: '2026-08-29T11:00:00Z',
    },
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'usr-2',
      senderName: 'Bob Tutor',
      content: 'Hi Alice! Let us coordinate our session.',
      createdAt: '2026-08-29T11:00:00Z',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'usr-1',
      senderName: 'Alice Student',
      content: 'Sounds great! Are you free at 3 PM?',
      createdAt: '2026-08-29T11:05:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    vi.mocked(authService.getSession).mockResolvedValue({
      user: { id: 'usr-1', email: 'alice@campus.edu' },
      access_token: 'valid-jwt',
    } as any);

    vi.mocked(chatService.getConversations).mockResolvedValue({
      items: mockConversations,
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });

    vi.mocked(chatService.getConversation).mockResolvedValue(mockConversations[0]!);

    vi.mocked(chatService.getMessages).mockResolvedValue({
      items: mockMessages,
      page: 0,
      size: 100,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });


    vi.mocked(chatService.markRead).mockResolvedValue({
      conversationId: 'conv-1',
      markedCount: 1,
    });
  });

  const renderComponent = (initialRoute = '/messages/conv-1') =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:conversationId" element={<MessagesPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );


  it('renders student messages heading and live connection indicator', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Direct Messaging/i)).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('displays conversations list and active conversation details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Bob Tutor/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Stanford/i).length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Hi Alice! Let us coordinate our session/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Sounds great! Are you free at 3 PM/i).length).toBeGreaterThan(0);
    });
  });



  it('allows composing and submitting a new chat message', async () => {
    vi.mocked(chatService.sendMessage).mockResolvedValue({
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'usr-1',
      senderName: 'Alice Student',
      content: 'Yes, 3 PM works perfectly!',
      createdAt: '2026-08-29T11:10:00Z',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(textarea, { target: { value: 'Yes, 3 PM works perfectly!' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalledWith(
        'conv-1',
        'Yes, 3 PM works perfectly!',
        undefined
      );
    });
  });

  it('displays empty state when no conversations exist', async () => {
    vi.mocked(chatService.getConversations).mockResolvedValue({
      items: [],
      page: 0,
      size: 50,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });


    renderComponent('/messages');

    await waitFor(() => {
      expect(screen.getByText(/No conversations found/i)).toBeInTheDocument();
    });
  });

  it('aligns sent messages on the right and received messages on the left with seen status', async () => {
    const seenMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'usr-2',
        senderName: 'Bob Tutor',
        content: 'Hi Alice! Let us coordinate our session.',
        createdAt: '2026-08-29T11:00:00Z',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'usr-1',
        senderName: 'Alice Student',
        content: 'Sounds great! Are you free at 3 PM?',
        readAt: '2026-08-29T11:06:00Z',
        createdAt: '2026-08-29T11:05:00Z',
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        senderId: 'usr-1',
        senderName: 'Alice Student',
        content: 'Let me know what time works best!',
        createdAt: '2026-08-29T11:07:00Z',
      },
    ];

    vi.mocked(chatService.getMessages).mockResolvedValue({
      items: seenMessages,
      page: 0,
      size: 100,
      totalElements: 3,
      totalPages: 1,
      first: true,
      last: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Sounds great! Are you free at 3 PM?')).toBeInTheDocument();
    });

    // Received message container should have items-start
    const receivedElements = screen.getAllByText('Hi Alice! Let us coordinate our session.');
    const lastReceived = receivedElements[receivedElements.length - 1];
    const receivedBubble = lastReceived?.closest('.flex.flex-col');
    expect(receivedBubble).toHaveClass('items-start');

    // Sent message container should have items-end
    const sentBubble = screen.getByText('Sounds great! Are you free at 3 PM?').closest('.flex.flex-col');
    expect(sentBubble).toHaveClass('items-end');

    // Message with readAt should show "Seen"
    expect(screen.getByText('Seen')).toBeInTheDocument();

    // Message without readAt should show "Sent"
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('renders messages in chronological order (oldest at the top, newest below)', async () => {
    // Return messages in descending order (newest first as backend does for pagination)
    const descendingMessages: ChatMessage[] = [
      {
        id: 'msg-new',
        conversationId: 'conv-1',
        senderId: 'usr-1',
        senderName: 'Alice Student',
        content: 'how are you',
        createdAt: '2026-08-29T11:36:00Z',
      },
      {
        id: 'msg-old',
        conversationId: 'conv-1',
        senderId: 'usr-1',
        senderName: 'Alice Student',
        content: 'hi',
        createdAt: '2026-08-29T11:34:00Z',
      },
    ];

    vi.mocked(chatService.getMessages).mockResolvedValue({
      items: descendingMessages,
      page: 0,
      size: 100,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('how are you')).toBeInTheDocument();
      expect(screen.getByText('hi')).toBeInTheDocument();
    });

    const renderedParagraphs = screen.getAllByText(/^(hi|how are you)$/);
    // 'hi' (older) should appear before 'how are you' (newer) in DOM stream
    const hiIndex = renderedParagraphs.findIndex((el) => el.textContent === 'hi');
    const howAreYouIndex = renderedParagraphs.findIndex((el) => el.textContent === 'how are you');
    expect(hiIndex).toBeLessThan(howAreYouIndex);
  });
});
