import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasJoinedRoom = useRef(false);

  const { token, user } = useSelector((state) => state.auth);
  const { messages, activeRoom, typingUsers, loading } = useSelector((state) => state.chat);
  const socket = useSocket(token);

  // Memoize currentMessages to ensure proper re-renders when messages change
  const currentMessages = useMemo(() => {
    const msgs = messages[groupId] || [];
    console.log('📨 Current messages for room', groupId, ':', msgs.length);
    return msgs;
  }, [messages, groupId]);
  
  const currentTypingUsers = useMemo(() => {
    return typingUsers[groupId] || [];
  }, [typingUsers, groupId]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Monitor socket connection status
  useEffect(() => {
    if (!socket) {
      console.log('⏳ Waiting for socket initialization...');
      return;
    }

    const handleConnect = () => {
      console.log('✅ Socket connected in ChatRoom');
      setIsConnected(true);
      // Rejoin room if we were in one
      if (groupId && hasJoinedRoom.current) {
        console.log('Rejoining room after reconnection:', groupId);
        socket.emit('join_room', groupId);
      }
    };

    const handleDisconnect = () => {
      console.log('⚠️ Socket disconnected in ChatRoom');
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial connection state - CRITICAL FIX
    console.log('🔍 Current socket connection state:', socket.connected);
    setIsConnected(socket.connected);

    // If already connected, trigger handleConnect manually
    if (socket.connected) {
      console.log('✅ Socket already connected on mount');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, groupId]);

  // Initialize chat room
  useEffect(() => {
    if (!groupId || !socket) {
      console.log('⏳ Waiting for groupId and socket...', { groupId: !!groupId, socket: !!socket });
      return;
    }

    console.log('🔄 Initializing chat room for group:', groupId, 'Socket connected:', socket.connected);

    // Socket event listeners - SET UP FIRST before joining room
    const handleReceiveMessage = (message) => {
      console.log('📩 Received message via socket:', message);
      if (message.roomId === groupId) {
        console.log('✅ Message is for current room, adding to state');
        dispatch(addMessage({ roomId: groupId, message }));
        setTimeout(scrollToBottom, 100);
      } else {
        console.log('⚠️ Message is for different room:', message.roomId, 'current:', groupId);
      }
    };

    const handleUserTyping = ({ userId, userName, isTyping }) => {
      if (userId !== user._id) {
        dispatch(setTypingUser({ roomId: groupId, userId, userName, isTyping }));
      }
    };

    const handleUserJoined = ({ userId, userName }) => {
      console.log('👋 User joined:', userName);
      dispatch(addOnlineUser(userId));
    };

    const handleUserLeft = ({ userId }) => {
      console.log('👋 User left:', userId);
      dispatch(removeOnlineUser(userId));
    };

    const handleRoomJoined = (data) => {
      console.log('✅ Successfully joined room:', data.roomId);
    };

    const handleError = (error) => {
      console.error('❌ Socket error:', error);
    };

    // Register event listeners FIRST
    console.log('📡 Registering socket event listeners for room:', groupId);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('room_joined', handleRoomJoined);
    socket.on('error', handleError);

    // Wait for socket to be connected before joining
    const joinRoom = () => {
      if (!socket.connected) {
        console.log('⏳ Socket not connected yet, waiting...');
        return;
      }

      console.log('✅ Joining room:', groupId);
      
      // Set active room
      dispatch(setActiveRoom(groupId));

      // Fetch previous messages
      console.log('📥 Fetching previous messages for room:', groupId);
      dispatch(fetchMessages({ roomId: groupId }));

      // Join the room
      console.log('🚪 Emitting join_room event for:', groupId);
      socket.emit('join_room', groupId);
      hasJoinedRoom.current = true;

      // Clear unread count
      dispatch(clearUnreadCount(groupId));
    };

    // If already connected, join immediately
    if (socket.connected) {
      console.log('✅ Socket already connected, joining room immediately');
      joinRoom();
    } else {
      // Wait for connection - use once to avoid duplicate joins
      console.log('⏳ Socket not connected, waiting for connection event...');
      const connectHandler = () => {
        console.log('✅ Socket connected event received, joining room');
        joinRoom();
      };
      socket.once('connect', connectHandler);
      
      // Cleanup if component unmounts before connection
      return () => {
        socket.off('connect', connectHandler);
        socket.off('receive_message', handleReceiveMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_joined', handleUserJoined);
        socket.off('user_left', handleUserLeft);
        socket.off('room_joined', handleRoomJoined);
        socket.off('error', handleError);
      };
    }

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up chat room:', groupId);
      if (socket.connected) {
        console.log('🚪 Leaving room:', groupId);
        socket.emit('leave_room', groupId);
      }
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('room_joined', handleRoomJoined);
      socket.off('error', handleError);
      dispatch(clearTypingUsers(groupId));
      dispatch(setActiveRoom(null));
      hasJoinedRoom.current = false;
    };
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

    if (!messageInput.trim() || !socket || !isConnected) {
      console.warn('Cannot send message:', { hasInput: !!messageInput.trim(), hasSocket: !!socket, isConnected });
      return;
    }

    const message = messageInput.trim();
    setMessageInput('');
    setIsTyping(false);

    // Stop typing indicator
    if (socket.connected) {
      socket.emit('typing', { roomId: groupId, isTyping: false });
    }

    // Send message via socket
    if (socket.connected) {
      console.log('📤 Sending message via socket:', { roomId: groupId, message });
      socket.emit('send_message', {
        roomId: groupId,
        message,
        messageType: 'text',
      });
      console.log('✅ Message emitted to socket');
    } else {
      console.error('❌ Socket not connected, cannot send message');
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Group Chat</h3>
            <p className="text-sm text-gray-500 mt-1">
              {currentMessages.length} messages
            </p>
          </div>
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-red-600 font-medium">Connecting...</span>
              </>
            )}
          </div>
        </div>
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
        {!isConnected && (
          <div className="mb-2 text-center text-sm text-yellow-600 bg-yellow-50 py-2 rounded">
            <span className="font-medium">⚠️ Reconnecting to server...</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            placeholder={isConnected ? "Type a message..." : "Waiting for connection..."}
            disabled={!isConnected}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || !isConnected}
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
