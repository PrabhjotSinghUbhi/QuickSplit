# Client-Server Alignment Fixes

## Summary
Fixed multiple mismatches between client-side code and server-side API contracts to ensure proper data flow and functionality.

## Issues Fixed

### 1. **Expense Creation - Field Name Mismatches**
**File:** `client/src/components/AddExpenseModal.jsx`

**Problem:** 
- Component was sending `splits` array to backend
- Backend expects `splitBetween` (array of user IDs) and `splitDetails` (for custom splits)

**Fix:**
- Modified `handleSubmit` to transform `splits` into proper backend format:
  - `splitBetween`: Array of user IDs
  - `splitDetails`: Array of `{ userId, amount }` objects for custom splits

```javascript
// Before: { splits: [...] }
// After: { 
//   splitBetween: [userId1, userId2, ...],
//   splitType: 'equal' | 'custom',
//   splitDetails: [{ userId, amount }, ...] // for custom only
// }
```

### 2. **Currency Field Name Mismatch**
**Files:** 
- `client/src/components/AddExpenseModal.jsx`
- `client/src/components/CreateGroupModal.jsx`
- `client/src/pages/Groups.jsx`
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/GroupDetail.jsx`

**Problem:**
- Client was using `group.currency`
- Backend returns `group.baseCurrency`

**Fix:**
- Updated all components to use `baseCurrency` as primary field with `currency` as fallback:
  ```javascript
  group.baseCurrency || group.currency || 'USD'
  ```
- Changed `CreateGroupModal` to send `baseCurrency` instead of `currency`

### 3. **Add Member - Unnecessary Fields**
**File:** `client/src/components/AddMemberModal.jsx`

**Problem:**
- Component was sending both `email` and `name` to backend
- Backend only accepts `email` or `userId`, not `name`

**Fix:**
- Removed `name` field from member data being sent to backend
- Backend finds user by email and uses their registered name

```javascript
// Before: { email, name }
// After: { email }
```

### 4. **Expense Split Display**
**Files:**
- `client/src/pages/GroupDetail.jsx`
- `client/src/pages/AllExpenses.jsx`

**Problem:**
- Pages were using `expense.splits?.length`
- Backend returns `expense.splitBetween` array

**Fix:**
- Updated to check both fields with fallback:
  ```javascript
  expense.splitBetween?.length || expense.splits?.length
  ```

### 5. **Group Creation - Automatic Member Addition**
**File:** `client/src/components/CreateGroupModal.jsx`

**Problem:**
- Client was manually adding current user to members array
- Backend automatically adds creator as admin member

**Fix:**
- Removed automatic user addition from client
- Let backend handle creator as admin member
- Only send additional members from the form

## Backend API Contract

### Group Endpoints
- **POST /api/groups** - Create group
  ```json
  {
    "name": "string",
    "description": "string (optional)",
    "baseCurrency": "USD",
    "members": [{ "email": "user@example.com" }]
  }
  ```
  Backend automatically adds creator as admin.

- **Response Format:**
  ```json
  {
    "payload": {
      "_id": "...",
      "name": "...",
      "baseCurrency": "USD",
      "members": [{ "_id", "name", "email", "role", "balance" }],
      ...
    },
    "statusCode": 201,
    "message": "...",
    "success": true
  }
  ```

### Expense Endpoints
- **POST /api/groups/:groupId/expenses** - Create expense
  ```json
  {
    "description": "string",
    "amount": 100,
    "currency": "USD",
    "paidBy": "userId",
    "splitBetween": ["userId1", "userId2"],
    "splitType": "equal|custom|percentage|settlement",
    "splitDetails": [{ "userId": "...", "amount": 50 }],
    "category": "Food",
    "date": "2024-01-01",
    "notes": "..."
  }
  ```

- **Response Format:**
  ```json
  {
    "payload": {
      "_id": "...",
      "groupId": "...",
      "paidBy": { "_id", "name", "email" },
      "splitBetween": ["userId1", "userId2"],
      "splitType": "equal",
      "splitDetails": [...],
      ...
    },
    "statusCode": 201,
    "message": "...",
    "success": true
  }
  ```

### Member Endpoints
- **POST /api/groups/:groupId/members** - Add member
  ```json
  {
    "email": "user@example.com"
  }
  ```
  Backend finds user by email and adds them to group.

## Testing Checklist

- [x] Create group with `baseCurrency`
- [x] Add members by email only
- [x] Create expense with `splitBetween` array
- [x] Custom split with `splitDetails`
- [x] Display expenses with correct split count
- [x] Display group currency correctly
- [x] Display expense paidBy name correctly

## Files Modified

### Components
1. `client/src/components/AddExpenseModal.jsx` - Expense creation data structure
2. `client/src/components/CreateGroupModal.jsx` - Group currency and member handling
3. `client/src/components/AddMemberModal.jsx` - Member data structure

### Pages
4. `client/src/pages/Groups.jsx` - Currency display
5. `client/src/pages/Dashboard.jsx` - Currency display
6. `client/src/pages/GroupDetail.jsx` - Currency and split display
7. `client/src/pages/AllExpenses.jsx` - Split display

## Notes

- All backend responses follow the pattern: `{ payload, statusCode, message, success }`
- All Redux async thunks extract data from `response.data.payload`
- Currency fields now consistently use `baseCurrency` as the source of truth
- Expense splits use `splitBetween` (IDs) + `splitDetails` (amounts) instead of combined `splits` array
- Backend handles user validation and automatic relationships (creator as admin, etc.)
