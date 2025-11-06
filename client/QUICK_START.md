# QuickSplit UI - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation Steps

1. **Navigate to client directory**
```bash
cd client
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

## 📦 What's Included

### Dependencies Installed
- ✅ React 19.1
- ✅ Redux Toolkit
- ✅ React Router DOM
- ✅ Axios
- ✅ Tailwind CSS v4
- ✅ Lucide React (icons)

### File Structure Created
```
client/src/
├── components/          # UI Components
│   ├── Layout.jsx
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── CreateGroupModal.jsx
│   └── AddExpenseModal.jsx
├── pages/              # Page Components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Groups.jsx
│   ├── GroupDetail.jsx
│   ├── AllExpenses.jsx
│   └── Settings.jsx
├── store/              # Redux Store
│   ├── store.js
│   └── slices/
│       ├── authSlice.js
│       ├── groupSlice.js
│       ├── expenseSlice.js
│       └── uiSlice.js
├── services/           # API Services
│   └── api.js
├── utils/              # Utilities
│   └── helpers.js
├── App.jsx             # Main App
└── main.jsx            # Entry Point
```

## 🎯 Key Features Overview

### 1. Authentication
- Login and registration pages
- JWT token management
- Protected routes
- Auto-redirect on authentication

### 2. Dashboard
- Overview statistics
- Recent groups and expenses
- Quick actions
- Responsive layout

### 3. Group Management
- Create/edit/delete groups
- Add/remove members
- View group details
- Track group expenses

### 4. Expense Tracking
- Add expenses with custom/equal splits
- View all expenses
- Filter and search
- Currency support

### 5. Balance & Settlements
- Automatic balance calculation
- Minimized settlement transactions
- Visual balance display
- Settlement suggestions

## 🎨 UI Components

### Sidebar Navigation
- Collapsible sidebar
- User profile display
- Quick group access
- Logout functionality

### Modals
- **Create Group Modal**: Add new expense groups
- **Add Expense Modal**: Record new expenses with splits

### Pages
- **Dashboard**: Overview and statistics
- **Groups**: All groups grid view
- **Group Detail**: Comprehensive group view
- **All Expenses**: Complete expense list
- **Settings**: User preferences

## 🔧 Configuration

### API Endpoint
Update `.env` file to point to your backend:
```env
VITE_API_URL=http://your-backend-url/api
```

### Tailwind Configuration
Tailwind CSS v4 is already configured. Customize in `tailwind.config.js` if needed.

## 📝 API Integration

The UI expects the following API endpoints:

### Auth Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user

### Group Endpoints
- `GET /groups` - Get all groups
- `POST /groups` - Create group
- `GET /groups/:id` - Get group details
- `PUT /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group
- `POST /groups/:id/members` - Add member
- `DELETE /groups/:id/members/:memberId` - Remove member
- `GET /groups/:id/balances` - Get balances

### Expense Endpoints
- `GET /groups/:id/expenses` - Get group expenses
- `POST /groups/:id/expenses` - Create expense
- `GET /expenses/:id` - Get expense details
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense
- `POST /groups/:id/settle` - Settle up

### Currency Endpoints
- `GET /currency/rates` - Get exchange rates
- `GET /currency/convert` - Convert amount

## 🧪 Testing the UI

### Without Backend (Mock Data)
You can test the UI by:
1. Commenting out API calls
2. Using mock data in Redux slices
3. Returning dummy data from action creators

### With Backend
1. Ensure backend is running
2. Update `VITE_API_URL` in `.env`
3. Test authentication first
4. Then test other features

## 🎨 Customization

### Change Color Scheme
Update colors in Tailwind classes:
- Primary: `blue-600` → your color
- Accents: `purple-600` → your color
- Success: `green-600` → your color

### Modify Layout
- Sidebar width: Change `w-64` in `Sidebar.jsx`
- Header height: Adjust padding in `Header.jsx`
- Content spacing: Update spacing classes

### Add New Features
1. Create new component in `components/`
2. Add route in `App.jsx`
3. Create Redux slice if needed
4. Connect to API in `services/api.js`

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or specify different port
npm run dev -- --port 3000
```

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tailwind Styles Not Working
```bash
# Restart dev server
# Tailwind CSS v4 should auto-configure
```

### API Connection Issues
1. Check `.env` file exists
2. Verify `VITE_API_URL` is correct
3. Ensure backend is running
4. Check browser console for errors

## 📚 Next Steps

1. **Set Up Backend**
   - Create Node.js/Express server
   - Set up MongoDB
   - Implement API endpoints

2. **Connect to Database**
   - Configure MongoDB connection
   - Create schemas/models
   - Test CRUD operations

3. **Implement Authentication**
   - JWT token generation
   - Password hashing
   - Protected routes

4. **Add Real-Time Updates**
   - WebSocket integration
   - Real-time notifications
   - Live balance updates

5. **Deploy**
   - Build for production: `npm run build`
   - Deploy to hosting (Vercel, Netlify, etc.)
   - Configure environment variables

## 💡 Tips

- Use Redux DevTools extension for debugging
- Check browser console for errors
- Test responsive design on different screen sizes
- Use React DevTools to inspect component tree
- Keep components small and focused

## 📖 Documentation

- **UI_README.md** - Complete UI documentation
- **COMPONENT_ARCHITECTURE.md** - Component structure
- **package.json** - All dependencies and scripts

## 🤝 Support

If you encounter issues:
1. Check the console for error messages
2. Review the API endpoints match your backend
3. Verify all dependencies are installed
4. Ensure environment variables are set correctly

## ✨ Features Highlight

### Already Implemented
- ✅ Complete authentication flow
- ✅ Group management (CRUD)
- ✅ Expense tracking with splits
- ✅ Balance calculation
- ✅ Settlement optimization
- ✅ Multi-currency support
- ✅ Responsive design
- ✅ Modal system
- ✅ Redux state management
- ✅ API integration ready

### Ready to Connect
The UI is fully functional and ready to connect to your backend API!

---

Happy coding! 🚀 Build something amazing with QuickSplit!
