import api from './axios'

// ─── Products API ─────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (storeSlug, params) => api.get('/products', { params, headers: { 'x-store-slug': storeSlug } }),
  getOne: (storeSlug, idOrSlug) => api.get(`/products/${idOrSlug}`, { headers: { 'x-store-slug': storeSlug } }),
  create: (storeSlug, data) => api.post('/products', data, { headers: { 'x-store-slug': storeSlug } }),
  update: (storeSlug, id, data) => api.put(`/products/${id}`, data, { headers: { 'x-store-slug': storeSlug } }),
  delete: (storeSlug, id) => api.delete(`/products/${id}`, { headers: { 'x-store-slug': storeSlug } }),
  updateInventory: (storeSlug, id, data) => api.patch(`/products/${id}/inventory`, data, { headers: { 'x-store-slug': storeSlug } }),
  bulkStatus: (storeSlug, data) => api.post('/products/bulk/status', data, { headers: { 'x-store-slug': storeSlug } }),
}

// ─── Orders API ───────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (storeSlug, data) => api.post('/orders', data, { headers: { 'x-store-slug': storeSlug } }),
  getVendorOrders: (params) => api.get('/orders/vendor', { params }),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  cancel: (id, data) => api.patch(`/orders/${id}/cancel`, data),
}

// ─── Categories API ───────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: (storeSlug) => api.get('/categories', { headers: { 'x-store-slug': storeSlug } }),
  create: (storeSlug, data) => api.post('/categories', data, { headers: { 'x-store-slug': storeSlug } }),
  update: (storeSlug, id, data) => api.put(`/categories/${id}`, data, { headers: { 'x-store-slug': storeSlug } }),
  delete: (storeSlug, id) => api.delete(`/categories/${id}`, { headers: { 'x-store-slug': storeSlug } }),
}

// ─── Coupons API ──────────────────────────────────────────────────────────────
export const couponsApi = {
  getAll: (storeSlug) => api.get('/coupons', { headers: { 'x-store-slug': storeSlug } }),
  create: (storeSlug, data) => api.post('/coupons', data, { headers: { 'x-store-slug': storeSlug } }),
  update: (storeSlug, id, data) => api.put(`/coupons/${id}`, data, { headers: { 'x-store-slug': storeSlug } }),
  delete: (storeSlug, id) => api.delete(`/coupons/${id}`, { headers: { 'x-store-slug': storeSlug } }),
  validate: (storeSlug, code, subtotal) => api.post('/coupons/validate', { code, subtotal }, { headers: { 'x-store-slug': storeSlug } }),
}

// ─── Payments API ─────────────────────────────────────────────────────────────
export const paymentsApi = {
  createStripeIntent: (storeSlug, data) => api.post('/payments/stripe/create-intent', data, { headers: { 'x-store-slug': storeSlug } }),
  confirmStripe: (storeSlug, data) => api.post('/payments/stripe/confirm', data, { headers: { 'x-store-slug': storeSlug } }),
  createRazorpayOrder: (storeSlug, data) => api.post('/payments/razorpay/create-order', data, { headers: { 'x-store-slug': storeSlug } }),
  verifyRazorpay: (storeSlug, data) => api.post('/payments/razorpay/verify', data, { headers: { 'x-store-slug': storeSlug } }),
}

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  getVendorAnalytics: (params) => api.get('/analytics/vendor', { params }),
  getPlatformAnalytics: (params) => api.get('/analytics/platform', { params }),
}

// ─── Reviews API ──────────────────────────────────────────────────────────────
export const reviewsApi = {
  getProductReviews: (storeSlug, productId) => api.get(`/reviews/product/${productId}`, { headers: { 'x-store-slug': storeSlug } }),
  create: (storeSlug, data) => api.post('/reviews', data, { headers: { 'x-store-slug': storeSlug } }),
  reply: (storeSlug, id, message) => api.post(`/reviews/${id}/reply`, { message }, { headers: { 'x-store-slug': storeSlug } }),
}

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  getStores: (params) => api.get('/admin/stores', { params }),
  updateStoreStatus: (id, status) => api.patch(`/admin/stores/${id}/status`, { status }),
  updateStorePlan: (id, plan) => api.patch(`/admin/stores/${id}/plan`, { plan }),
}

// ─── Stores API ───────────────────────────────────────────────────────────────
export const storesApi = {
  getAll: (params) => api.get('/stores', { params }),
  getBySlug: (slug) => api.get(`/stores/${slug}`),
  getMyStore: () => api.get('/stores/vendor/my-store'),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
}

// ─── Subscriptions API ────────────────────────────────────────────────────────
export const subscriptionsApi = {
  getPlans:    ()               => api.get('/subscriptions/plans'),
  getMine:     ()               => api.get('/subscriptions'),
  upgrade:     (data)           => api.post('/subscriptions/upgrade', data),
  cancel:      (data)           => api.post('/subscriptions/cancel', data),
  // Stripe
  stripeCheckout:  (data) => api.post('/subscriptions/stripe/checkout', data),
  // Razorpay
  razorpayCreate:  (data) => api.post('/subscriptions/razorpay/create', data),
  // PayPal
  paypalCreate:    (data) => api.post('/subscriptions/paypal/create', data),
  paypalActivate:  (data) => api.post('/subscriptions/paypal/activate', data),
  // Admin
  adminSetPlan: (data)   => api.post('/subscriptions/admin/set-plan', data),
}

// ─── Upload API ───────────────────────────────────────────────────────────────
export const uploadApi = {
  // Upload multiple images from local disk
  uploadImages: (formData) => api.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Upload single image
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Upload video
  uploadVideo: (formData) => api.post('/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Delete file
  deleteFile: (filename) => api.delete(`/upload/${filename}`),
}

// ─── Attributes API ───────────────────────────────────────────────────────────
export const attributesApi = {
  getAll:           (storeSlug, params)         => api.get('/attributes', { params, headers: { 'x-store-slug': storeSlug } }),
  getOne:           (storeSlug, id)             => api.get(`/attributes/${id}`, { headers: { 'x-store-slug': storeSlug } }),
  getPresets:       (storeSlug)                 => api.get('/attributes/presets', { headers: { 'x-store-slug': storeSlug } }),
  create:           (storeSlug, data)           => api.post('/attributes', data, { headers: { 'x-store-slug': storeSlug } }),
  applyPreset:      (storeSlug, key)            => api.post('/attributes/preset', { key }, { headers: { 'x-store-slug': storeSlug } }),
  update:           (storeSlug, id, data)       => api.put(`/attributes/${id}`, data, { headers: { 'x-store-slug': storeSlug } }),
  delete:           (storeSlug, id)             => api.delete(`/attributes/${id}`, { headers: { 'x-store-slug': storeSlug } }),
  addValue:         (storeSlug, id, data)       => api.post(`/attributes/${id}/values`, data, { headers: { 'x-store-slug': storeSlug } }),
  updateValue:      (storeSlug, id, vid, data)  => api.put(`/attributes/${id}/values/${vid}`, data, { headers: { 'x-store-slug': storeSlug } }),
  deleteValue:      (storeSlug, id, vid)        => api.delete(`/attributes/${id}/values/${vid}`, { headers: { 'x-store-slug': storeSlug } }),
  generateVariants: (storeSlug, data)           => api.post('/attributes/generate-variants', data, { headers: { 'x-store-slug': storeSlug } }),
}

// ─── Banners API ──────────────────────────────────────────────────────────────
export const bannersApi = {
  getAll:    (params)     => api.get('/banners', { params }),
  getMine:   (params)     => api.get('/banners/manage/all', { params }),
  create:    (data)       => api.post('/banners', data),
  update:    (id, data)   => api.put(`/banners/${id}`, data),
  remove:    (id)         => api.delete(`/banners/${id}`),
  trackView: (id)         => api.post(`/banners/${id}/view`),
  trackClick:(id)         => api.post(`/banners/${id}/click`),
}

// ─── Customer / Profile API ───────────────────────────────────────────────────
export const customerApi = {
  // Wishlist
  getWishlist:    ()            => api.get('/customer/wishlist'),
  addWishlist:    (productId)   => api.post('/customer/wishlist', { productId }),
  removeWishlist: (productId)   => api.delete(`/customer/wishlist/${productId}`),
  // Notifications
  getNotifs:      ()            => api.get('/customer/notifications'),
  markRead:       (id)          => api.patch(`/customer/notifications/${id}/read`),
  markAllRead:    ()            => api.patch('/customer/notifications/read-all'),
  // Refunds
  getRefunds:     ()            => api.get('/customer/refunds'),
  createRefund:   (data)        => api.post('/customer/refunds', data),
  // Reviews
  getMyReviews:   ()            => api.get('/customer/reviews'),
}
