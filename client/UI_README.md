# QuickSplit UI - React Frontend

A modern, responsive React-based UI for the QuickSplit expense management application, built with Redux Toolkit for state management and Axios for API communication.

## 🚀 Features

- **Authentication System**: Login and registration with JWT-based authentication
- **Dashboard**: Overview of groups, expenses, and balances
- **Group Management**: Create, view, edit, and delete expense groups
- **Expense Tracking**: Add, view, and manage expenses with custom or equal splits
- **Balance Calculation**: Automatic calculation of who owes whom
- **Settlement Optimization**: Minimizes the number of transactions needed
- **Multi-Currency Support**: Support for multiple currencies with real-time conversion
- **Responsive Design**: Fully responsive UI built with Tailwind CSS
- **Real-time Updates**: Redux state management for instant UI updates

## 📁 Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx       # Main layout wrapper
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── Header.jsx       # Top header with actions
│   │   ├── CreateGroupModal.jsx
│   │   └── AddExpenseModal.jsx
│   ├── pages/               # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Groups.jsx
│   │   ├── GroupDetail.jsx
│   │   ├── AllExpenses.jsx
│   │   └── Settings.jsx
│   ├── store/               # Redux store configuration
│   │   ├── store.js         # Store configuration
│   │   └── slices/          # Redux slices
│   │       ├── authSlice.js
│   │       ├── groupSlice.js
│   │       ├── expenseSlice.js
│   │       └── uiSlice.js
│   ├── services/            # API services
│   │   └── api.js           # Axios API configuration
│   ├── utils/               # Utility functions
│   │   └── helpers.js       # Helper functions
│   ├── App.jsx              # Main app component with routing
│   └── main.jsx             # Entry point
├── .env                     # Environment variables
└── package.json             # Dependencies
```

## 🛠️ Tech Stack

- **React 19.1** - UI framework
- **Redux Toolkit** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## 📦 Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔑 Key Components

### Redux Store Structure

#### Auth Slice
- Manages user authentication state
- Handles login, register, and logout actions
- Stores JWT token in localStorage

#### Group Slice
- Manages groups and their members
- Handles CRUD operations for groups
- Fetches and stores group balances

#### Expense Slice
- Manages expenses across all groups
- Handles expense creation, updates, and deletion
- Organizes expenses by group ID

#### UI Slice
- Manages UI state (sidebar, modals, notifications)
- Controls modal visibility
- Handles theme preferences

### API Service Layer

The `api.js` file provides a centralized Axios instance with:
- Automatic JWT token injection
- Request/response interceptors
- Error handling
- Organized API endpoints:
  - Auth API (login, register, getCurrentUser)
  - Group API (CRUD operations, members, balances)
  - Expense API (CRUD operations, settlements)
  - Currency API (exchange rates, conversion)

### Utility Functions

Helper functions in `helpers.js`:
- `formatCurrency()` - Format amounts with currency symbols
- `formatDate()` - Date formatting
- `getRelativeTime()` - Human-readable time differences
- `calculateSplit()` - Split calculations
- `simplifyDebts()` - Minimize transactions for settlements
- `getUserInitials()` - Generate user initials
- `getRandomColor()` - Generate avatar colors

## 🎨 UI Pages

### 1. Login & Register
- Clean authentication forms
- Form validation
- Error handling
- Redirect after successful authentication

### 2. Dashboard
- Overview statistics (groups, expenses, balances)
- Recent groups and expenses
- Quick action buttons
- Responsive grid layout

### 3. Groups
- Grid view of all groups
- Search and filter functionality
- Group statistics preview
- Create group action

### 4. Group Detail
- Detailed group information
- Member management
- Expense list
- Balance calculations
- Settlement suggestions
- Add expense and member actions

### 5. All Expenses
- Comprehensive expense list across all groups
- Filtering by group and date
- Search functionality
- Expense details with group tags

### 6. Settings
- Profile management
- Notification preferences
- Currency preferences
- Security settings

## 🔐 Authentication Flow

1. User logs in via `/login` page
2. JWT token is stored in localStorage
3. Token is automatically attached to all API requests
4. `fetchCurrentUser()` is called to get user details
5. User is redirected to dashboard
6. Protected routes check authentication state
7. Unauthorized users are redirected to login

## 🌐 API Integration

All API calls are made through the centralized `api.js` service:

```javascript
import { authAPI, groupAPI, expenseAPI } from './services/api';

// Example: Login
const response = await authAPI.login({ email, password });

// Example: Create group
const group = await groupAPI.createGroup({ name, description, currency });

// Example: Add expense
const expense = await expenseAPI.createExpense(groupId, expenseData);
```

## 🎯 Redux Actions

### Auth Actions
```javascript
dispatch(login({ email, password }));
dispatch(register({ name, email, password }));
dispatch(logout());
dispatch(fetchCurrentUser());
```

### Group Actions
```javascript
dispatch(fetchGroups());
dispatch(fetchGroupDetails(groupId));
dispatch(createGroup(groupData));
dispatch(updateGroup({ groupId, groupData }));
dispatch(deleteGroup(groupId));
dispatch(addMember({ groupId, memberData }));
dispatch(fetchBalances(groupId));
```

### Expense Actions
```javascript
dispatch(fetchExpenses(groupId));
dispatch(createExpense({ groupId, expenseData }));
dispatch(updateExpense({ expenseId, expenseData }));
dispatch(deleteExpense(expenseId));
dispatch(settleExpense({ groupId, settlementData }));
```

## 🎨 Styling

The UI uses Tailwind CSS v4 with a modern design system:

- **Colors**: Blue primary, purple accents, semantic colors
- **Typography**: Clear hierarchy with consistent sizing
- **Spacing**: 8px base unit with consistent spacing scale
- **Shadows**: Subtle shadows for depth
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first approach with breakpoints

## 🚦 Routing

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (protected)
- `/groups` - All groups list (protected)
- `/groups/:groupId` - Group details (protected)
- `/expenses` - All expenses (protected)
- `/settings` - User settings (protected)

## 📱 Responsive Design

The UI is fully responsive with breakpoints:
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## 🔄 State Management Flow

1. Component dispatches action
2. Redux Toolkit handles async thunk
3. API call is made via Axios
4. Response updates Redux store
5. Component re-renders with new data
6. UI reflects changes instantly

## 🛡️ Error Handling

- API errors are caught and displayed to users
- Form validation prevents invalid submissions
- Network errors trigger user notifications
- 401 errors automatically redirect to login
- User-friendly error messages

## 🎯 Next Steps

To connect this UI to a backend:

1. Set up the backend server (Node.js/Express)
2. Implement MongoDB models and schemas
3. Create API endpoints matching the frontend expectations
4. Set up JWT authentication
5. Implement currency conversion service
6. Add WebSocket for real-time updates
7. Deploy both frontend and backend

## 📝 Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

Built with ❤️ using React, Redux, and Tailwind CSS
