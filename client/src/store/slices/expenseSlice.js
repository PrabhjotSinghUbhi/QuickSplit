import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { expenseAPI } from '../../services/api';

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.getExpenses(groupId);
      return { groupId, expenses: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async ({ groupId, expenseData }, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.createExpense(groupId, expenseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create expense');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async ({ expenseId, expenseData }, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.updateExpense(expenseId, expenseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (expenseId, { rejectWithValue }) => {
    try {
      await expenseAPI.deleteExpense(expenseId);
      return expenseId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete expense');
    }
  }
);

export const settleExpense = createAsyncThunk(
  'expenses/settleExpense',
  async ({ groupId, settlementData }, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.settleExpense(groupId, settlementData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to settle expense');
    }
  }
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState: {
    expensesByGroup: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expensesByGroup[action.payload.groupId] = action.payload.expenses;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create expense
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        const groupId = action.payload.group;
        if (!state.expensesByGroup[groupId]) {
          state.expensesByGroup[groupId] = [];
        }
        state.expensesByGroup[groupId].unshift(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update expense
      .addCase(updateExpense.fulfilled, (state, action) => {
        const groupId = action.payload.group;
        if (state.expensesByGroup[groupId]) {
          const index = state.expensesByGroup[groupId].findIndex(
            e => e._id === action.payload._id
          );
          if (index !== -1) {
            state.expensesByGroup[groupId][index] = action.payload;
          }
        }
      })
      // Delete expense
      .addCase(deleteExpense.fulfilled, (state, action) => {
        Object.keys(state.expensesByGroup).forEach(groupId => {
          state.expensesByGroup[groupId] = state.expensesByGroup[groupId].filter(
            e => e._id !== action.payload
          );
        });
      })
      // Settle expense
      .addCase(settleExpense.fulfilled, (state, action) => {
        const groupId = action.payload.group;
        if (!state.expensesByGroup[groupId]) {
          state.expensesByGroup[groupId] = [];
        }
        state.expensesByGroup[groupId].unshift(action.payload);
      });
  },
});

export const { clearError } = expenseSlice.actions;
export default expenseSlice.reducer;
