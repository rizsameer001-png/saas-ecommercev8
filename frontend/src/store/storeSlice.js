import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/axios'

export const fetchStore = createAsyncThunk('store/fetch', async (slug, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/stores/${slug}`)
    return data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const fetchMyStore = createAsyncThunk('store/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/stores/vendor/my-store')
    return data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const updateMyStore = createAsyncThunk('store/update', async ({ id, ...storeData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/stores/${id}`, storeData)
    return data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

const storeSlice = createSlice({
  name: 'store',
  initialState: {
    currentStore: null,    // storefront context
    myStore: null,         // vendor's own store
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentStore: (state) => { state.currentStore = null },
    setMyStore: (state, action) => { state.myStore = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStore.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchStore.fulfilled, (state, action) => { state.currentStore = action.payload; state.loading = false })
      .addCase(fetchStore.rejected, (state, action) => { state.error = action.payload; state.loading = false })
      .addCase(fetchMyStore.fulfilled, (state, action) => { state.myStore = action.payload })
      .addCase(updateMyStore.fulfilled, (state, action) => { state.myStore = action.payload })
  }
})

export const { clearCurrentStore, setMyStore } = storeSlice.actions
export default storeSlice.reducer
