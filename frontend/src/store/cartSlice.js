import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/axios'
import toast from 'react-hot-toast'

const getStoreSlug = () => {
  const match = window.location.pathname.match(/\/store\/([^/]+)/)
  return match ? match[1] : null
}

export const fetchCart = createAsyncThunk('cart/fetch', async (storeSlug, { rejectWithValue }) => {
  try {
    const slug = storeSlug || getStoreSlug()
    if (!slug) return { items: [], subtotal: 0, itemCount: 0 }
    const { data } = await api.get('/cart', { headers: { 'x-store-slug': slug } })
    return data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const addToCart = createAsyncThunk('cart/add', async ({ storeSlug, productId, quantity = 1, variantId }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/add', { productId, quantity, variantId }, {
      headers: { 'x-store-slug': storeSlug }
    })
    toast.success('Added to cart!')
    return data.data
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add to cart')
    return rejectWithValue(err.response?.data?.message)
  }
})

export const updateCartItem = createAsyncThunk('cart/update', async ({ storeSlug, itemId, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/cart/item/${itemId}`, { quantity }, {
      headers: { 'x-store-slug': storeSlug }
    })
    return data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const removeCartItem = createAsyncThunk('cart/remove', async ({ storeSlug, itemId }, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/cart/item/${itemId}`, {
      headers: { 'x-store-slug': storeSlug }
    })
    toast.success('Item removed')
    return data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async ({ storeSlug, code }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/coupon', { code }, { headers: { 'x-store-slug': storeSlug } })
    toast.success(data.message)
    return data.data
  } catch (err) {
    toast.error(err.response?.data?.message || 'Invalid coupon')
    return rejectWithValue(err.response?.data?.message)
  }
})

export const clearCart = createAsyncThunk('cart/clear', async (storeSlug, { rejectWithValue }) => {
  try {
    await api.delete('/cart/clear', { headers: { 'x-store-slug': storeSlug } })
    return null
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    coupon: null,
    loading: false,
    error: null,
    isOpen: false,
  },
  reducers: {
    toggleCart: (state) => { state.isOpen = !state.isOpen },
    openCart: (state) => { state.isOpen = true },
    closeCart: (state) => { state.isOpen = false },
    resetCart: (state) => { state.items = []; state.coupon = null },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      if (action.payload) {
        state.items = action.payload.items || []
        state.coupon = action.payload.coupon || null
      }
      state.loading = false
    }
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected, (state) => { state.loading = false })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeCartItem.fulfilled, setCart)
      .addCase(applyCoupon.fulfilled, setCart)
      .addCase(clearCart.fulfilled, (state) => { state.items = []; state.coupon = null })
  }
})

export const { toggleCart, openCart, closeCart, resetCart } = cartSlice.actions

// Selectors
export const selectCartItems = (state) => state.cart.items
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
export const selectCartCoupon = (state) => state.cart.coupon

export default cartSlice.reducer
