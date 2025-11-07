import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { expenseAPI, groupAPI } from '../../services/api';

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await expenseAPI.getExpenses(groupId);
      // Backend returns: { payload: [...expenses], statusCode, message }
      return { groupId, expenses: response.data.payload };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async ({ groupId, expenseData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await expenseAPI.createExpense(groupId, expenseData);
      // Fetch updated group details to get new balances and totalSpent
      const groupResponse = await groupAPI.getGroupById(groupId);
      return { 
        expense: response.data.payload,
        group: groupResponse.data.payload
      };
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
      // Backend returns: { payload: {...expense}, statusCode, message }
      return response.data.payload;
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

const expenseSlice = createSlice({
  name: 'expenses',
  initialState: {
    expensesByGroup: {},
    selectedExpense: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedExpense: (state, action) => {
      state.selectedExpense = action.payload;
    },
    clearSelectedExpense: (state) => {
      state.selectedExpense = null;
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
        const groupId = action.payload.expense.group;
        if (!state.expensesByGroup[groupId]) {
          state.expensesByGroup[groupId] = [];
        }
        state.expensesByGroup[groupId].unshift(action.payload.expense);
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
      });
  },
});

export const { clearError, setSelectedExpense, clearSelectedExpense } = expenseSlice.actions;
export default expenseSlice.reducer;
