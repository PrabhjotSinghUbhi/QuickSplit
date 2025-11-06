import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { groupAPI } from '../../services/api';
import { createExpense } from './expenseSlice';

// Async thunks
export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await groupAPI.getGroups();
      // Backend returns: { payload: [...groups], statusCode, message }
      return response.data.payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch groups');
    }
  }
);

export const fetchGroupDetails = createAsyncThunk(
  'groups/fetchGroupDetails',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupAPI.getGroupById(groupId);
      // Backend returns: { payload: {...group}, statusCode, message }
      return response.data.payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group details');
    }
  }
);

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await groupAPI.createGroup(groupData);
      // Backend returns: { payload: {...group}, statusCode, message }
      return response.data.payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create group');
    }
  }
);

export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async ({ groupId, groupData }, { rejectWithValue }) => {
    try {
      const response = await groupAPI.updateGroup(groupId, groupData);
      // Backend returns: { payload: {...group}, statusCode, message }
      return response.data.payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update group');
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      await groupAPI.deleteGroup(groupId);
      return groupId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete group');
    }
  }
);

export const addMember = createAsyncThunk(
  'groups/addMember',
  async ({ groupId, memberData }, { rejectWithValue }) => {
    try {
      const response = await groupAPI.addMember(groupId, memberData);
      // Backend returns: { payload: {...group}, statusCode, message }
      return response.data.payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
  }
);

export const removeMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, memberId }, { rejectWithValue }) => {
    try {
      const response = await groupAPI.removeMember(groupId, memberId);
      // Backend returns: { payload: {...group}, statusCode, message }
      return response.data.payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
  }
);

export const fetchBalances = createAsyncThunk(
  'groups/fetchBalances',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupAPI.getBalances(groupId);
      // Backend now returns: { payload: { balances, settlements, totalSpent }, statusCode, message }
      return { groupId, data: response.data.payload };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch balances');
    }
  }
);

export const settleUp = createAsyncThunk(
  'groups/settleUp',
  async ({ groupId, from, to, amount }, { rejectWithValue, dispatch }) => {
    try {
      // Record the settlement
      await groupAPI.settleExpense(groupId, {
        from,
        to,
        amount
      });
      
      // Refetch balances to get updated state from backend
      await dispatch(fetchBalances(groupId));
      
      // Fetch updated group details
      const groupResponse = await groupAPI.getGroupById(groupId);
      return groupResponse.data.payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to settle up');
    }
  }
);

const groupSlice = createSlice({
  name: 'groups',
  initialState: {
    groups: [],
    currentGroup: null,
    balances: {},
    settlements: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch group details
      .addCase(fetchGroupDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroupDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create group
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.push(action.payload);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update group
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = action.payload;
        }
      })
      // Delete group
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g._id !== action.payload);
        if (state.currentGroup?._id === action.payload) {
          state.currentGroup = null;
        }
      })
      // Add member
      .addCase(addMember.fulfilled, (state, action) => {
        if (state.currentGroup) {
          state.currentGroup = action.payload;
        }
      })
      // Remove member
      .addCase(removeMember.fulfilled, (state, action) => {
        if (state.currentGroup) {
          state.currentGroup = action.payload;
        }
      })
      // Fetch balances
      .addCase(fetchBalances.fulfilled, (state, action) => {
        const { groupId, data } = action.payload;
        state.balances[groupId] = data.balances;
        state.settlements[groupId] = data.settlements;
        
        // Update currentGroup if it matches
        if (state.currentGroup && state.currentGroup._id === groupId) {
          state.currentGroup.totalSpent = data.totalSpent;
          // Update member balances
          state.currentGroup.members = state.currentGroup.members.map(member => {
            const balance = data.balances.find(b => b.user === member._id);
            return balance ? { ...member, balance: balance.amount } : member;
          });
        }
      })
      // Settle up
      .addCase(settleUp.fulfilled, (state, action) => {
        if (state.currentGroup) {
          state.currentGroup = action.payload;
        }
        // Update the group in the groups list as well
        const groupIndex = state.groups.findIndex(g => g._id === action.payload._id);
        if (groupIndex !== -1) {
          state.groups[groupIndex] = action.payload;
        }
      })
      // Handle expense creation (update group balances and totalSpent)
      .addCase(createExpense.fulfilled, (state, action) => {
        if (action.payload.group) {
          // Update current group if it matches
          if (state.currentGroup && state.currentGroup._id === action.payload.group._id) {
            state.currentGroup = action.payload.group;
          }
          // Update in groups list
          const groupIndex = state.groups.findIndex(g => g._id === action.payload.group._id);
          if (groupIndex !== -1) {
            state.groups[groupIndex] = action.payload.group;
          }
        }
      });
  },
});

export const { clearCurrentGroup, clearError } = groupSlice.actions;
export default groupSlice.reducer;
