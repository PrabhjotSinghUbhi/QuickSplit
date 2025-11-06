import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import {
  fetchMessages,
  addMessage,
  setActiveRoom,
  setTypingUser,
  clearTypingUsers,
  addOnlineUser,
  removeOnlineUser,
  clearUnreadCount,
} from '../store/slices/chatSlice';
import useSocket from '../hooks/useSocket';

const ChatRoom = () => {
  const { groupId } = useParams();
  const dispatch = useDispatch();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { token, user } = useSelector((state) => state.auth);
  const { messages, activeRoom, typingUsers, loading } = useSelector((state) => state.chat);
  const socket = useSocket(token);

  const currentMessages = messages[groupId] || [];
  const currentTypingUsers = typingUsers[groupId] || [];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize chat room
  useEffect(() => {
    if (groupId && socket) {
      // Set active room
      dispatch(setActiveRoom(groupId));

      // Fetch previous messages
      dispatch(fetchMessages({ roomId: groupId }));

      // Join the room
      socket.emit('join_room', groupId);

      // Clear unread count
      dispatch(clearUnreadCount(groupId));

      // Socket event listeners
      socket.on('receive_message', (message) => {
        if (message.roomId === groupId) {
          dispatch(addMessage({ roomId: groupId, message }));
          setTimeout(scrollToBottom, 100);
        }
      });

      socket.on('user_typing', ({ userId, userName, isTyping }) => {
        if (userId !== user._id) {
          dispatch(setTypingUser({ roomId: groupId, userId, userName, isTyping }));
        }
      });

      socket.on('user_joined', ({ userId, userName }) => {
        dispatch(addOnlineUser(userId));
      });

      socket.on('user_left', ({ userId }) => {
        dispatch(removeOnlineUser(userId));
      });

      socket.on('room_joined', (data) => {
        console.log('Successfully joined room:', data.roomId);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Cleanup
      return () => {
        socket.emit('leave_room', groupId);
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_joined');
        socket.off('user_left');
        socket.off('room_joined');
        socket.off('error');
        dispatch(clearTypingUsers(groupId));
        dispatch(setActiveRoom(null));
      };
    }
  }, [groupId, socket, dispatch, user]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', { roomId: groupId, isTyping: true });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('typing', { roomId: groupId, isTyping: false });
      }
    }, 1000);
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !socket) return;

    const message = messageInput.trim();
    setMessageInput('');
    setIsTyping(false);

    // Stop typing indicator
    socket.emit('typing', { roomId: groupId, isTyping: false });

    // Send message via socket
    socket.emit('send_message', {
      roomId: groupId,
      message,
      messageType: 'text',
    });
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  if (loading && currentMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-lg font-semibold text-gray-800">Group Chat</h3>
        <p className="text-sm text-gray-500 mt-1">
          {currentMessages.length} messages
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          currentMessages.map((msg, index) => {
            const isOwnMessage = msg.sender._id === user._id;
            const showAvatar =
              index === 0 ||
              currentMessages[index - 1].sender._id !== msg.sender._id;

            return (
              <div
                key={msg._id}
                className={`flex items-start gap-3 ${
                  isOwnMessage ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                {showAvatar ? (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                      isOwnMessage
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}
                  >
                    {getInitials(msg.sender.name)}
                  </div>
                ) : (
                  <div className="w-8" />
                )}

                {/* Message Content */}
                <div
                  className={`flex flex-col max-w-[70%] ${
                    isOwnMessage ? 'items-end' : 'items-start'
                  }`}
                >
                  {showAvatar && (
                    <span className="text-xs font-medium text-gray-600 mb-1 px-1">
                      {isOwnMessage ? 'You' : msg.sender.name}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 mt-1 px-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>
              {currentTypingUsers.map((u) => u.userName).join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="px-6 py-4 border-t border-gray-200 bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;
