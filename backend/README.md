# SaaS eCommerce — Backend (Node.js + Express + MongoDB)

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (Access + Refresh Tokens)
- **Payments**: Stripe, Razorpay
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
backend/
├── src/
│   ├── server.js              # Entry point
│   ├── models/
│   │   ├── User.js            # User model (all roles)
│   │   ├── Store.js           # Multi-tenant store model
│   │   ├── Product.js         # Product with variants
│   │   ├── Order.js           # Order lifecycle
│   │   └── index.js           # Category, Cart, Coupon, Review
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── cartController.js
│   │   └── analyticsController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── stores.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   ├── coupons.js
│   │   ├── reviews.js
│   │   ├── analytics.js
│   │   ├── admin.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js            # JWT guard, role-based access, store resolver
│   └── scripts/
│       └── seed.js            # Demo data seeder
├── uploads/                   # Uploaded files (gitignored)
├── .env.example
└── package.json
```

## Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB running locally or MongoDB Atlas URI

### 2. Install
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

**Minimum required .env:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saas_ecommerce
JWT_SECRET=your_super_secret_key_at_least_32_chars
JWT_REFRESH_SECRET=another_secret_key
```

### 4. Seed Database (Demo Data)
```bash
npm run seed
```
Creates demo accounts, 2 stores, products, categories, coupons.

### 5. Start Server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Auth Headers
```
Authorization: Bearer <accessToken>
x-store-slug: techgear-pro         # Required for store-scoped routes
x-session-id: <uuid>               # Required for guest cart
```

### Endpoints

#### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register (customer/vendor) |
| POST | `/auth/login` | — | Login |
| POST | `/auth/refresh-token` | — | Refresh access token |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/profile` | ✅ | Update profile |
| PUT | `/auth/change-password` | ✅ | Change password |
| POST | `/auth/forgot-password` | — | Send reset email |
| PUT | `/auth/reset-password/:token` | — | Reset password |
| POST | `/auth/address` | ✅ | Add address |

#### Stores
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stores` | — | List all stores |
| GET | `/stores/:slug` | — | Get store by slug |
| POST | `/stores` | vendor | Create store |
| PUT | `/stores/:id` | vendor | Update store |
| GET | `/stores/vendor/my-store` | vendor | Get own store |

#### Products (require `x-store-slug` header)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | — | List products (paginated, filterable) |
| GET | `/products/:idOrSlug` | — | Get product |
| POST | `/products` | vendor | Create product |
| PUT | `/products/:id` | vendor | Update product |
| DELETE | `/products/:id` | vendor | Archive product |
| PATCH | `/products/:id/inventory` | vendor | Update inventory |
| POST | `/products/bulk/status` | vendor | Bulk status update |

#### Cart (require `x-store-slug` header)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cart` | optional | Get cart |
| POST | `/cart/add` | optional | Add item |
| PUT | `/cart/item/:itemId` | optional | Update quantity |
| DELETE | `/cart/item/:itemId` | optional | Remove item |
| DELETE | `/cart/clear` | optional | Clear cart |
| POST | `/cart/coupon` | optional | Apply coupon |
| DELETE | `/cart/coupon` | optional | Remove coupon |

#### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | optional | Place order |
| GET | `/orders/my-orders` | customer | Customer orders |
| GET | `/orders/vendor` | vendor | Store orders |
| GET | `/orders/:id` | ✅ | Get order |
| PATCH | `/orders/:id/status` | vendor | Update status |
| PATCH | `/orders/:id/cancel` | customer | Cancel order |

#### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/stripe/create-intent` | Create Stripe payment intent |
| POST | `/payments/stripe/confirm` | Confirm Stripe payment |
| POST | `/payments/webhook` | Stripe webhook handler |
| POST | `/payments/razorpay/create-order` | Create Razorpay order |
| POST | `/payments/razorpay/verify` | Verify Razorpay signature |
| POST | `/payments/refund` | Process refund |

#### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/vendor?period=30d` | vendor | Vendor dashboard data |
| GET | `/analytics/platform?period=30d` | super_admin | Platform-wide analytics |

#### Admin (super_admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/:id/toggle-status` | Activate/deactivate user |
| GET | `/admin/stores` | List all stores |
| PATCH | `/admin/stores/:id/status` | Update store status |
| PATCH | `/admin/stores/:id/plan` | Update store plan |

---

## Demo Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@demo.com | password123 |
| Vendor 1 | vendor@demo.com | password123 |
| Vendor 2 | vendor2@demo.com | password123 |
| Customer | customer@demo.com | password123 |

## Demo Stores
| Store | Slug | URL |
|-------|------|-----|
| TechGear Pro | techgear-pro | http://localhost:5173/store/techgear-pro |
| Luxe Fashion | luxe-fashion | http://localhost:5173/store/luxe-fashion |

## Coupon Codes
| Store | Code | Type |
|-------|------|------|
| TechGear Pro | WELCOME10 | 10% off |
| TechGear Pro | SAVE20 | $20 off (min $100) |
| Luxe Fashion | FASHION15 | 15% off (max $30) |

## Plan Limits
| Plan | Products | Orders/mo | Storage |
|------|----------|-----------|---------|
| Free | 10 | 100 | 1 GB |
| Basic | 100 | 1,000 | 5 GB |
| Pro | 1,000 | 10,000 | 20 GB |
| Enterprise | Unlimited | Unlimited | 100 GB |

## Payment Setup

### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Get test keys from Dashboard → Developers → API keys
3. Set `STRIPE_SECRET_KEY` in `.env`
4. For webhooks: `stripe listen --forward-to localhost:5000/api/payments/webhook`

### Razorpay
1. Create account at [razorpay.com](https://razorpay.com)
2. Get API keys from Settings → API Keys
3. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`
