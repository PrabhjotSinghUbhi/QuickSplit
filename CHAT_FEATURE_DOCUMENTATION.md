# QuickSplit Real-Time Group Chat Feature

## 📋 Overview

This document describes the real-time group chat feature added to QuickSplit. The chat allows users in the same group to communicate instantly using Socket.IO.

## 🏗️ Architecture

### Backend Components

1. **Message Model** (`server/models/message.model.js`)
   - Stores chat messages in MongoDB
   - Fields: roomId, senderId, message, messageType, readBy, timestamps
   - Static methods for retrieving messages and marking as read

2. **Chat Controller** (`server/controller/chat.controller.js`)
   - `getRoomMessages`: Fetch all messages for a room/group
   - `sendMessage`: Send and persist a message
   - `markMessagesAsRead`: Mark messages as read by user
   - `getUnreadCount`: Get unread message count for a room

3. **Chat Routes** (`server/routes/chat.route.js`)
   - `GET /api/chat/:roomId` - Get messages
   - `POST /api/chat/send` - Send message
   - `PUT /api/chat/:roomId/read` - Mark as read
   - `GET /api/chat/:roomId/unread` - Get unread count

4. **Socket.IO Server** (`server/index.js`)
   - Authentication middleware for Socket connections
   - Event handlers:
     - `join_room`: Join a group chat room
     - `leave_room`: Leave a group chat room
     - `send_message`: Send a message to the room
     - `typing`: Typing indicator
     - `mark_as_read`: Mark messages as read
   - Event emitters:
     - `receive_message`: Broadcast new messages
     - `user_joined`: Notify when user joins
     - `user_left`: Notify when user leaves
     - `user_typing`: Typing indicator broadcast
     - `messages_read`: Read receipt notification

### Frontend Components

1. **Socket Hook** (`client/src/hooks/useSocket.js`)
   - Manages Socket.IO connection
   - Auto-reconnection on disconnect
   - Token-based authentication

2. **Chat Redux Slice** (`client/src/store/slices/chatSlice.js`)
   - State management for chat messages
   - Actions for message operations
   - Typing indicator state
   - Online users tracking
   - Unread message counts

3. **ChatRoom Component** (`client/src/components/ChatRoom.jsx`)
   - Main chat UI component
   - Message display with avatars
   - Input box with typing indicator
   - Auto-scroll to latest message
   - Mobile-responsive design

4. **GroupDetail Integration** (`client/src/pages/GroupDetail.jsx`)
   - Tab system to switch between Expenses and Chat
   - Chat room embedded in group detail page

## 🔧 Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install socket.io
   ```

2. **Environment Variables**
   - Ensure `CORS_ORIGIN` is set in `.env` file
   - Example: `CORS_ORIGIN=http://localhost:5173`

3. **Start Server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd client
   npm install socket.io-client
   ```

2. **Environment Variables**
   - Set `VITE_API_URL` in `.env` file
   - Example: `VITE_API_URL=http://localhost:5000/api`

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📡 Socket.IO Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `join_room` | `roomId` | Join a specific group chat |
| `leave_room` | `roomId` | Leave a group chat |
| `send_message` | `{ roomId, message, messageType }` | Send a message |
| `typing` | `{ roomId, isTyping }` | Send typing status |
| `mark_as_read` | `{ roomId }` | Mark messages as read |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `receive_message` | `message object` | Receive new message |
| `user_joined` | `{ userId, userName, timestamp }` | User joined notification |
| `user_left` | `{ userId, userName, timestamp }` | User left notification |
| `user_typing` | `{ userId, userName, isTyping }` | Typing indicator |
| `messages_read` | `{ userId, roomId, timestamp }` | Read receipt |
| `room_joined` | `{ roomId }` | Room join confirmation |
| `error` | `{ message }` | Error notification |

## 🎨 UI Features

### Message Display
- User avatars with initials
- Different colors for own vs other messages
- Timestamps (smart formatting)
- Auto-scroll to latest message
- Empty state when no messages

### Input Features
- Real-time typing indicator
- Character limit (2000 chars)
- Send on Enter key
- Disabled state when empty
- Loading states

### Responsive Design
- Mobile-friendly layout
- Tailwind CSS styling
- Smooth animations
- Gradient backgrounds
- Hover effects

## 🔐 Security

1. **Authentication**
   - JWT token verification on Socket connection
   - Middleware checks user membership before allowing room access

2. **Authorization**
   - Users can only join rooms they're members of
   - Message sending restricted to group members
   - Messages filtered by group membership

3. **Data Validation**
   - Input sanitization (trim, maxlength)
   - Required field validation
   - Type checking

## 🚀 Performance Optimizations

1. **Database**
   - Indexed queries on roomId and createdAt
   - Limited message fetching (default 50)
   - Pagination support

2. **Frontend**
   - Socket connection reuse
   - Redux state management
   - Memoized components
   - Efficient re-renders

3. **Real-time**
   - Socket.IO auto-reconnection
   - Typing debounce (1 second)
   - Message deduplication

## 🧪 Testing Checklist

- [ ] User can join a group chat
- [ ] Messages appear instantly for all members
- [ ] Typing indicator works correctly
- [ ] Messages persist on page refresh
- [ ] Unread count updates properly
- [ ] Auto-scroll works on new messages
- [ ] Mobile view is responsive
- [ ] Authentication prevents unauthorized access
- [ ] Error handling works (network issues)
- [ ] Multiple tabs/devices sync properly

## 📱 Mobile Responsiveness

- Flexible layout using Tailwind
- Touch-friendly input areas
- Optimized message bubbles
- Proper scroll behavior
- Responsive font sizes

## 🔮 Future Enhancements (Optional)

1. **Typing Indicator** ✅ (Implemented)
   - Shows when users are typing
   - Debounced for performance

2. **Online/Offline Status**
   - Show which members are currently online
   - Last seen timestamp

3. **Message Features**
   - Edit messages
   - Delete messages
   - Reply to specific messages
   - Message reactions (emoji)

4. **Media Support**
   - Image uploads
   - File attachments
   - Voice messages

5. **Notifications**
   - Browser notifications for new messages
   - Sound alerts
   - Unread badge on tab

6. **Search**
   - Search message history
   - Filter by user
   - Date range filters

## 🐛 Troubleshooting

### Socket Connection Issues

**Problem**: Socket not connecting
**Solution**: 
- Check CORS settings in server
- Verify token is being sent
- Check network tab for WebSocket connection

**Problem**: Messages not appearing
**Solution**:
- Check if user joined the room
- Verify Socket event listeners are attached
- Check Redux state updates

### Message Persistence

**Problem**: Messages not persisting
**Solution**:
- Check MongoDB connection
- Verify message model save operation
- Check API endpoint responses

### Authentication

**Problem**: Unauthorized errors
**Solution**:
- Verify JWT token is valid
- Check token in Socket auth
- Ensure user is member of group

## 📚 API Reference

### REST Endpoints

```
GET    /api/chat/:roomId              Get messages for a room
POST   /api/chat/send                 Send a message
PUT    /api/chat/:roomId/read         Mark messages as read
GET    /api/chat/:roomId/unread       Get unread count
```

### Request/Response Examples

**Get Messages**
```javascript
GET /api/chat/60d5ec49f1b2c8b1f8e4e1a1

Response:
{
  payload: [
    {
      _id: "...",
      roomId: "60d5ec49f1b2c8b1f8e4e1a1",
      sender: {
        _id: "...",
        name: "John Doe",
        email: "john@example.com"
      },
      message: "Hello everyone!",
      messageType: "text",
      createdAt: "2024-11-07T10:30:00.000Z"
    }
  ],
  statusCode: 200,
  message: "Messages fetched successfully"
}
```

**Send Message**
```javascript
POST /api/chat/send
Body: {
  roomId: "60d5ec49f1b2c8b1f8e4e1a1",
  message: "Hello everyone!",
  messageType: "text"
}

Response:
{
  payload: { /* message object */ },
  statusCode: 201,
  message: "Message sent successfully"
}
```

## 🎯 Best Practices

1. **Always disconnect sockets on component unmount**
2. **Use Redux for state management**
3. **Implement error handling for all Socket events**
4. **Validate data on both client and server**
5. **Use environment variables for configuration**
6. **Keep Socket event names consistent**
7. **Log errors for debugging**
8. **Test with multiple users/devices**

## 📄 License

This feature is part of the QuickSplit project.

---

**Author**: AI Assistant  
**Date**: November 7, 2025  
**Version**: 1.0.0
