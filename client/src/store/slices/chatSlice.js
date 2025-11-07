import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ roomId, limit = 50, skip = 0 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/${roomId}?limit=${limit}&skip=${skip}`);
      return {
        roomId,
        messages: response.data.payload
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessageAPI = createAsyncThunk(
  'chat/sendMessage',
  async ({ roomId, message, messageType = 'text' }, { rejectWithValue }) => {
    try {
      const response = await api.post('/chat/send', { roomId, message, messageType });
      return response.data.payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (roomId, { rejectWithValue }) => {
    try {
      await api.put(`/chat/${roomId}/read`);
      return roomId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  'chat/getUnreadCount',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/${roomId}/unread`);
      return {
        roomId,
        count: response.data.payload.unreadCount
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get unread count');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: {}, // { roomId: [messages] }
    activeRoom: null,
    typingUsers: {}, // { roomId: [userIds] }
    onlineUsers: [], // [userId]
    unreadCounts: {}, // { roomId: count }
    loading: false,
    error: null,
    sendingMessage: false,
  },
  reducers: {
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload;
    },
    addMessage: (state, action) => {
      const { roomId, message } = action.payload;
      console.log('🔄 Redux: Adding message to room', roomId, message);
      
      if (!state.messages[roomId]) {
        console.log('📦 Redux: Creating new message array for room', roomId);
        state.messages[roomId] = [];
      }
      
      // Check if message already exists (avoid duplicates)
      const exists = state.messages[roomId].some(msg => msg._id === message._id);
      if (!exists) {
        console.log('✅ Redux: Message is new, adding to array');
        state.messages[roomId].push(message);
        console.log('📊 Redux: Total messages in room now:', state.messages[roomId].length);
      } else {
        console.log('⚠️ Redux: Message already exists, skipping');
      }
    },
    setMessages: (state, action) => {
      const { roomId, messages } = action.payload;
      state.messages[roomId] = messages;
    },
    clearMessages: (state, action) => {
      const roomId = action.payload;
      if (roomId) {
        delete state.messages[roomId];
      } else {
        state.messages = {};
      }
    },
    setTypingUser: (state, action) => {
      const { roomId, userId, userName, isTyping } = action.payload;
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }
      if (isTyping) {
        const exists = state.typingUsers[roomId].some(user => user.userId === userId);
        if (!exists) {
          state.typingUsers[roomId].push({ userId, userName });
        }
      } else {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(
          user => user.userId !== userId
        );
      }
    },
    clearTypingUsers: (state, action) => {
      const roomId = action.payload;
      if (roomId) {
        state.typingUsers[roomId] = [];
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action) => {
      const userId = action.payload;
      if (!state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },
    removeOnlineUser: (state, action) => {
      const userId = action.payload;
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
    },
    setUnreadCount: (state, action) => {
      const { roomId, count } = action.payload;
      state.unreadCounts[roomId] = count;
    },
    clearUnreadCount: (state, action) => {
      const roomId = action.payload;
      state.unreadCounts[roomId] = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { roomId, messages } = action.payload;
        state.messages[roomId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessageAPI.pending, (state) => {
        state.sendingMessage = true;
      })
      .addCase(sendMessageAPI.fulfilled, (state) => {
        state.sendingMessage = false;
      })
      .addCase(sendMessageAPI.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const roomId = action.payload;
        state.unreadCounts[roomId] = 0;
      })
      // Get unread count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        const { roomId, count } = action.payload;
        state.unreadCounts[roomId] = count;
      });
  },
});

export const {
  setActiveRoom,
  addMessage,
  setMessages,
  clearMessages,
  setTypingUser,
  clearTypingUsers,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setUnreadCount,
  clearUnreadCount,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
