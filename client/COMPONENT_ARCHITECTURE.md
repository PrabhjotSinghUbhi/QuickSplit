# QuickSplit Component Architecture

## Component Hierarchy

```
App (Router + Redux Provider)
│
├── Public Routes
│   ├── Login
│   │   ├── Form with email/password
│   │   ├── Remember me checkbox
│   │   └── Link to Register
│   │
│   └── Register
│       ├── Form with name/email/password
│       ├── Password confirmation
│       └── Link to Login
│
├── Protected Routes (Layout Wrapper)
│   │
│   ├── Sidebar (Persistent)
│   │   ├── Logo & Toggle
│   │   ├── User Info
│   │   ├── Navigation Links
│   │   │   ├── Dashboard
│   │   │   ├── Groups
│   │   │   ├── All Expenses
│   │   │   └── Settings
│   │   ├── Groups List
│   │   └── Logout Button
│   │
│   ├── Header (Persistent)
│   │   ├── Menu Toggle
│   │   ├── Page Title
│   │   ├── Add Expense Button
│   │   └── Notifications
│   │
│   └── Main Content Area
│       │
│       ├── Dashboard Page
│       │   ├── Welcome Header
│       │   ├── Stats Grid (4 cards)
│       │   │   ├── Total Groups
│       │   │   ├── Total Expenses
│       │   │   ├── You Owe
│       │   │   └── You Are Owed
│       │   ├── Recent Groups (Left)
│       │   ├── Recent Expenses (Right)
│       │   └── Quick Actions Banner
│       │
│       ├── Groups Page
│       │   ├── Header with Create Button
│       │   ├── Search Bar
│       │   └── Groups Grid
│       │       └── Group Cards
│       │           ├── Group Icon
│       │           ├── Name & Members
│       │           ├── Description
│       │           ├── Stats (Spent, Expenses)
│       │           └── Currency Badge
│       │
│       ├── Group Detail Page
│       │   ├── Header with Back & Actions
│       │   ├── Stats Grid (3 cards)
│       │   │   ├── Total Spent
│       │   │   ├── Members Count
│       │   │   └── Your Balance
│       │   ├── Main Content (2/3 width)
│       │   │   ├── Expenses Header
│       │   │   └── Expense List
│       │   │       └── Expense Cards
│       │   │           ├── Icon
│       │   │           ├── Description
│       │   │           ├── Paid By & Date
│       │   │           └── Amount
│       │   └── Sidebar (1/3 width)
│       │       ├── Members Section
│       │       │   └── Member List with Avatars
│       │       └── Settlements Section
│       │           ├── Settlement Cards
│       │           └── Settle Up Button
│       │
│       ├── All Expenses Page
│       │   ├── Header
│       │   ├── Filters Bar
│       │   │   ├── Search Input
│       │   │   ├── Group Filter
│       │   │   └── Date Filter
│       │   └── Expenses List
│       │       └── Expense Rows
│       │           ├── Icon
│       │           ├── Description & Group Tag
│       │           ├── Metadata (Paid By, Date, People)
│       │           └── Amount
│       │
│       └── Settings Page
│           ├── Settings Menu (Left)
│           │   ├── Profile
│           │   ├── Notifications
│           │   ├── Preferences
│           │   └── Security
│           └── Settings Content (Right)
│               ├── Profile Information
│               │   ├── Name Input
│               │   ├── Email Input
│               │   └── Default Currency
│               ├── Notification Preferences
│               │   ├── Email Toggle
│               │   ├── Expense Added Toggle
│               │   └── Balance Change Toggle
│               └── Save Button
│
└── Modals (Global)
    │
    ├── Create Group Modal
    │   ├── Modal Header with Close
    │   ├── Form
    │   │   ├── Group Name Input
    │   │   ├── Description Textarea
    │   │   └── Currency Select
    │   └── Actions (Cancel, Create)
    │
    └── Add Expense Modal
        ├── Modal Header with Close
        ├── Form
        │   ├── Group Select
        │   ├── Description Input
        │   ├── Amount Input
        │   ├── Currency Select
        │   ├── Paid By Select
        │   ├── Split Type Radio
        │   └── Split Details List
        │       └── Member Split Inputs
        └── Actions (Cancel, Add)
```

## State Management Structure

```
Redux Store
│
├── auth
│   ├── user: { _id, name, email }
│   ├── token: string
│   ├── isAuthenticated: boolean
│   ├── loading: boolean
│   └── error: string | null
│
├── groups
│   ├── groups: Array<Group>
│   ├── currentGroup: Group | null
│   ├── balances: { [groupId]: Array<Balance> }
│   ├── loading: boolean
│   └── error: string | null
│
├── expenses
│   ├── expensesByGroup: { [groupId]: Array<Expense> }
│   ├── loading: boolean
│   └── error: string | null
│
└── ui
    ├── sidebarOpen: boolean
    ├── theme: 'light' | 'dark'
    ├── notifications: Array<Notification>
    └── modals: {
        ├── createGroup: boolean
        ├── addExpense: boolean
        ├── addMember: boolean
        └── settleUp: boolean
    }
```

## Data Flow Patterns

### Creating a Group
```
User clicks "Create Group"
    ↓
UI Slice: openModal('createGroup')
    ↓
CreateGroupModal renders
    ↓
User fills form and submits
    ↓
Dispatch: createGroup(groupData)
    ↓
API: POST /groups with groupData
    ↓
Group Slice: Add group to state
    ↓
UI Slice: closeModal('createGroup')
    ↓
UI updates to show new group
```

### Adding an Expense
```
User clicks "Add Expense"
    ↓
UI Slice: openModal('addExpense')
    ↓
AddExpenseModal renders
    ↓
Load current group members
    ↓
User fills form (description, amount, splits)
    ↓
Dispatch: createExpense({ groupId, expenseData })
    ↓
API: POST /groups/:id/expenses
    ↓
Expense Slice: Add expense to group
    ↓
Dispatch: fetchBalances(groupId) to update
    ↓
UI updates with new expense & balances
```

### Viewing Group Details
```
User clicks on a group
    ↓
Navigate to /groups/:groupId
    ↓
GroupDetail component mounts
    ↓
Dispatch: fetchGroupDetails(groupId)
Dispatch: fetchBalances(groupId)
Dispatch: fetchExpenses(groupId)
    ↓
API calls made in parallel
    ↓
State updated with responses
    ↓
Component renders with data
    ↓
Shows: members, expenses, balances, settlements
```

## Key Features by Page

### Dashboard
- **Stats Overview**: Quick glance at all metrics
- **Recent Activity**: Latest groups and expenses
- **Quick Actions**: Fast access to common tasks
- **Responsive Grid**: Adapts to screen size

### Groups Page
- **Grid Layout**: Visual cards for each group
- **Search**: Find groups quickly
- **Quick Create**: One-click group creation
- **Group Preview**: Stats visible on cards

### Group Detail
- **Comprehensive View**: All group information
- **Member Management**: Add/remove members
- **Expense Tracking**: Full expense history
- **Smart Settlements**: Minimized transactions
- **Balance Display**: Clear who owes whom

### All Expenses
- **Unified View**: All expenses across groups
- **Advanced Filters**: Search, group, date filters
- **Group Tags**: Visual group identification
- **Detailed Information**: Full expense metadata

### Settings
- **Profile Management**: Update user info
- **Preferences**: Customize experience
- **Notifications**: Control alerts
- **Currency Default**: Set preferred currency

## Reusable Patterns

### Card Component Pattern
```jsx
<Card>
  <CardHeader>
    <Icon />
    <Title />
    <Actions />
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Stats or actions */}
  </CardFooter>
</Card>
```

### Modal Pattern
```jsx
<Modal isOpen={modals.modalName}>
  <ModalHeader>
    <Title />
    <CloseButton />
  </ModalHeader>
  <ModalBody>
    <Form />
  </ModalBody>
  <ModalFooter>
    <CancelButton />
    <SubmitButton />
  </ModalFooter>
</Modal>
```

### List Item Pattern
```jsx
<ListItem>
  <Avatar />
  <Info>
    <Title />
    <Subtitle />
    <Metadata />
  </Info>
  <Amount />
  <Actions />
</ListItem>
```

## Color Scheme

### Primary Colors
- Blue: `#3b82f6` (Primary actions, links)
- Purple: `#8b5cf6` (Accents, gradients)
- Green: `#10b981` (Success, positive balances)
- Red: `#ef4444` (Danger, negative balances)
- Yellow: `#f59e0b` (Warnings, settlements)

### Neutral Colors
- Gray 50-900: Background, text, borders
- White: Cards, modals, surfaces

### Semantic Colors
- Success: Green tones
- Error: Red tones
- Warning: Yellow/Orange tones
- Info: Blue tones

## Responsive Breakpoints

- **Mobile**: < 768px (Single column, compact)
- **Tablet**: 768px - 1024px (Two columns)
- **Desktop**: > 1024px (Full layout, sidebar)

## Animation & Transitions

- **Page Transitions**: Fade in/out
- **Modal Animations**: Scale and fade
- **Hover Effects**: Smooth color/shadow changes
- **Loading States**: Spin animations
- **Sidebar Toggle**: Smooth slide

---

This architecture provides a scalable, maintainable foundation for QuickSplit's UI.
