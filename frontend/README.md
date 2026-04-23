# SaaS eCommerce — Frontend (React + Vite + Tailwind)

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **State Management**: Redux Toolkit + Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios (with auto token refresh)
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Payments**: Stripe React SDK

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── main.jsx                  # Entry point
│   ├── App.jsx                   # Router configuration
│   ├── api/
│   │   ├── axios.js              # Axios instance + interceptors
│   │   └── services.js           # API service modules
│   ├── store/
│   │   ├── store.js              # Redux store
│   │   ├── authSlice.js          # Auth state
│   │   ├── cartSlice.js          # Cart state
│   │   └── storeSlice.js         # Current store state
│   ├── components/
│   │   ├── layouts/
│   │   │   ├── RootLayout.jsx    # Public pages layout
│   │   │   ├── DashboardLayout.jsx # Vendor dashboard
│   │   │   ├── StorefrontLayout.jsx # Customer storefront
│   │   │   └── AdminLayout.jsx   # Super admin panel
│   │   ├── ui/
│   │   │   └── index.jsx         # Shared UI components
│   │   └── storefront/
│   │       ├── ProductCard.jsx
│   │       └── CartDrawer.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ForgotPasswordPage.jsx
│   │   ├── public/
│   │   │   ├── LandingPage.jsx
│   │   │   └── StoresPage.jsx
│   │   ├── storefront/
│   │   │   ├── StorefrontHome.jsx
│   │   │   ├── ProductListPage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── OrderSuccessPage.jsx
│   │   │   ├── OrderTrackingPage.jsx
│   │   │   └── CustomerOrdersPage.jsx
│   │   ├── vendor/
│   │   │   ├── VendorDashboard.jsx
│   │   │   ├── VendorProducts.jsx
│   │   │   ├── VendorProductForm.jsx
│   │   │   ├── VendorOrders.jsx
│   │   │   ├── VendorOrderDetail.jsx
│   │   │   ├── VendorCategories.jsx
│   │   │   ├── VendorCoupons.jsx
│   │   │   ├── VendorCustomers.jsx
│   │   │   ├── VendorAnalytics.jsx
│   │   │   └── VendorSettings.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminStores.jsx
│   │       ├── AdminUsers.jsx
│   │       └── AdminAnalytics.jsx
│   └── styles/
│       └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- Backend server running at `http://localhost:5000`

### 2. Install
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 4. Start Development Server
```bash
npm run dev
```

App runs at: `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## Application Routes

### Public Routes
| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/stores` | Browse all stores |
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Password reset |

### Storefront Routes (Multi-Tenant)
| Path | Description |
|------|-------------|
| `/store/:slug` | Store homepage |
| `/store/:slug/products` | Product listing |
| `/store/:slug/products/:id` | Product detail |
| `/store/:slug/cart` | Shopping cart |
| `/store/:slug/checkout` | Checkout |
| `/store/:slug/order-success/:id` | Order confirmation |
| `/store/:slug/track/:id` | Order tracking |
| `/store/:slug/my-orders` | Customer orders |

### Vendor Dashboard
| Path | Description |
|------|-------------|
| `/dashboard` | Overview & analytics |
| `/dashboard/products` | Product management |
| `/dashboard/products/new` | Add product |
| `/dashboard/products/:id/edit` | Edit product |
| `/dashboard/orders` | Order management |
| `/dashboard/orders/:id` | Order detail |
| `/dashboard/categories` | Category management |
| `/dashboard/coupons` | Coupon management |
| `/dashboard/customers` | Customer list |
| `/dashboard/analytics` | Analytics charts |
| `/dashboard/settings` | Store settings |

### Admin Panel
| Path | Description |
|------|-------------|
| `/admin` | Platform dashboard |
| `/admin/stores` | Manage all stores |
| `/admin/users` | Manage all users |
| `/admin/analytics` | Platform analytics |

---

## Key Features

### Multi-Tenant Architecture
Each store has its own slug-based URL. The `x-store-slug` header is automatically attached to all API requests based on the current route parameter.

### Authentication Flow
- Access tokens (7 days) + Refresh tokens (30 days)
- Auto token refresh via Axios interceptor
- Role-based route guards (`ProtectedRoute`, `GuestRoute`)

### Cart System
- Persists for logged-in users (by user ID)
- Guest carts via `x-session-id` header
- Real-time updates via Redux

### State Management
| Slice | Purpose |
|-------|---------|
| `authSlice` | User session, login/logout |
| `cartSlice` | Cart items, coupon, open/close |
| `storeSlice` | Current storefront + vendor's store |

---

## Demo Login
After seeding the backend:

| Role | Email | Password | Redirect |
|------|-------|----------|---------|
| Super Admin | admin@demo.com | password123 | `/admin` |
| Vendor | vendor@demo.com | password123 | `/dashboard` |
| Customer | customer@demo.com | password123 | `/` |

## Demo Stores
- TechGear Pro → http://localhost:5173/store/techgear-pro
- Luxe Fashion → http://localhost:5173/store/luxe-fashion
