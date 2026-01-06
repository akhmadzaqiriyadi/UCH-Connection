# UCH Connection - Campus Marketplace Feature Plan

## 🎯 Feature Overview
**Campus Marketplace** - Platform e-commerce internal kampus untuk civitas akademika (mahasiswa, dosen, staff) menjual dan membeli produk & jasa.

## 📦 Core Features

### 1. **Product & Service Management**
- Mahasiswa/Dosen dapat listing produk atau jasa
- Categories: Produk Fisik, Jasa/Services, Pre-order
- Upload multiple images per product
- Product details: name, description, price, stock, condition (new/used)
- Service details: name, description, price, duration, availability

### 2. **Product Categories** (Flexible Structure)
**Produk:**
- Buku & Alat Tulis
- Elektronik & Gadget
- Fashion & Aksesoris
- Makanan & Minuman
- Kerajinan & Handicraft
- Pre-order (PO) Items

**Jasa:**
- Jasa Design (Graphic, UI/UX)
- Jasa Pembuatan Website/Aplikasi
- Jasa Editing (Video, Foto)
- Les/Tutoring
- Jasa Konsultasi
- Jasa Print & Fotocopy

### 3. **Order Management**
- Shopping cart functionality
- Order placement with status tracking
- Order statuses: `pending`, `confirmed`, `processing`, `shipped`, `completed`, `cancelled`
- Order history for buyers & sellers
- Order details with timeline

### 4. **Payment System**
**Phase 1 (MVP):** Manual Payment Verification
- COD (Cash on Delivery) - meet up di kampus
- Transfer Bank - upload bukti transfer
- Admin/Seller verification

**Phase 2 (Future):** Payment Gateway Integration
- E-wallet (GoPay, OVO, Dana)
- Virtual Account
- Credit Card

### 5. **Rating & Review System**
- Buyers can rate & review after order completion
- 1-5 star rating
- Written review with optional photos
- Seller response to reviews
- Average rating display

### 6. **Search & Filter**
- Search by product/service name
- Filter by category, price range, condition, rating
- Sort by: newest, price (low-high, high-low), rating, popularity

### 7. **User Profile & Dashboard**
**Seller Dashboard:**
- My Products/Services
- Active Orders
- Sales Statistics
- Revenue Tracking
- Product Performance

**Buyer Dashboard:**
- My Orders
- Wishlist
- Order History
- Transaction History

### 8. **Communication**
**Phase 1:** Direct WhatsApp Link
**Phase 2:** In-app Chat System

---

## 🗄️ Database Schema

### **Tables**

#### `marketplace_products`
```typescript
{
  id: uuid (PK)
  sellerId: uuid (FK -> users.id)
  title: string
  description: text
  type: enum('product', 'service')
  category: string
  price: decimal
  stock: integer (null for services)
  condition: enum('new', 'used', 'preorder') (null for services)
  images: json[] // [{url, isPrimary}]
  specifications: json // flexible key-value
  status: enum('draft', 'active', 'sold_out', 'archived')
  views: integer (default 0)
  totalSales: integer (default 0)
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt: timestamp (soft delete)
}
```

#### `marketplace_orders`
```typescript
{
  id: uuid (PK)
  buyerId: uuid (FK -> users.id)
  sellerId: uuid (FK -> users.id)
  orderNumber: string (unique, generated)
  items: json[] // [{productId, title, price, quantity, subtotal}]
  totalAmount: decimal
  paymentMethod: enum('cod', 'bank_transfer', 'ewallet')
  paymentProof: string (nullable)
  shippingAddress: text
  notes: text
  status: enum('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled')
  cancelReason: text (nullable)
  completedAt: timestamp (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `marketplace_reviews`
```typescript
{
  id: uuid (PK)
  orderId: uuid (FK -> marketplace_orders.id)
  productId: uuid (FK -> marketplace_products.id)
  buyerId: uuid (FK -> users.id)
  sellerId: uuid (FK -> users.id)
  rating: integer (1-5)
  review: text
  images: json[] (optional photos)
  sellerResponse: text (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `marketplace_cart`
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  productId: uuid (FK -> marketplace_products.id)
  quantity: integer
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `marketplace_wishlists`
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users.id)
  productId: uuid (FK -> marketplace_products.id)
  createdAt: timestamp
}
```

---

## 🚀 API Endpoints Structure

### **Public/User Endpoints**

#### Products
- `GET /marketplace/products` - List all active products (with filters)
- `GET /marketplace/products/:id` - Product detail
- `GET /marketplace/products/search` - Search products
- `GET /marketplace/categories` - List categories

#### Cart (Auth Required)
- `GET /marketplace/cart` - Get user cart
- `POST /marketplace/cart` - Add to cart
- `PATCH /marketplace/cart/:id` - Update quantity
- `DELETE /marketplace/cart/:id` - Remove from cart
- `DELETE /marketplace/cart` - Clear cart

#### Orders (Auth Required)
- `POST /marketplace/orders` - Create order from cart
- `GET /marketplace/orders` - My orders (buyer)
- `GET /marketplace/orders/:id` - Order detail
- `POST /marketplace/orders/:id/upload-proof` - Upload payment proof
- `POST /marketplace/orders/:id/cancel` - Cancel order
- `POST /marketplace/orders/:id/complete` - Mark as received

#### Reviews (Auth Required)
- `POST /marketplace/orders/:id/review` - Add review
- `GET /marketplace/products/:id/reviews` - Product reviews

### **Seller Endpoints** (Auth + Role Check)

- `POST /marketplace/seller/products` - Create product
- `GET /marketplace/seller/products` - My products
- `PATCH /marketplace/seller/products/:id` - Update product
- `DELETE /marketplace/seller/products/:id` - Delete product
- `GET /marketplace/seller/orders` - Orders received
- `POST /marketplace/seller/orders/:id/confirm` - Confirm payment
- `POST /marketplace/seller/orders/:id/process` - Process order
- `POST /marketplace/seller/orders/:id/ship` - Mark as shipped
- `GET /marketplace/seller/dashboard` - Sales statistics

### **Admin Endpoints**

- `GET /marketplace/admin/products` - All products (moderation)
- `PATCH /marketplace/admin/products/:id/status` - Approve/Reject product
- `GET /marketplace/admin/orders` - All orders
- `GET /marketplace/admin/stats` - Marketplace statistics

---

## 🎨 User Flow

### **Seller Journey**
1. Login as Mahasiswa/Dosen
2. Navigate to "Jual Produk/Jasa"
3. Fill product/service form + upload images
4. Submit for review (auto-active or admin approval)
5. Receive order notification
6. Confirm payment
7. Process & ship order
8. Complete transaction

### **Buyer Journey**
1. Browse products (guest or logged-in)
2. View product details
3. Add to cart
4. Checkout (must login)
5. Choose payment method
6. Upload payment proof (if bank transfer)
7. Wait for seller confirmation
8. Receive product
9. Mark as completed
10. Leave review & rating

---

## 📊 Dashboard Metrics

### Seller Dashboard
- Total Products Listed
- Active Products
- Total Orders Received
- Total Revenue
- Average Rating
- Best Selling Products
- Recent Orders

### Buyer Dashboard
- Total Orders
- Pending Orders
- Completed Orders
- Total Spending
- Wishlist Items

### Admin Dashboard
- Total Products
- Total Orders
- Total GMV (Gross Merchandise Value)
- Active Sellers
- Product by Category
- Top Sellers
- Recent Transactions

---

## 🔒 Business Rules

1. **Listing Rules:**
   - Only verified civitas (mahasiswa, dosen, staff) can sell
   - Products must comply with campus policy (no illegal items)
   - Maximum 10 images per product
   - Title max 100 chars, description max 2000 chars

2. **Pricing:**
   - Minimum price: Rp 1,000
   - Maximum price: Rp 50,000,000 (for safety)

3. **Order Rules:**
   - Buyer can cancel before seller confirms
   - Seller can reject order with reason
   - Order auto-cancelled if not confirmed within 24h
   - Buyer must mark as completed within 7 days of "shipped" status

4. **Review Rules:**
   - Only after order status = 'completed'
   - One review per order-product pair
   - Seller can respond once

5. **Cart Rules:**
   - Max 20 items in cart
   - Cart expires after 7 days of inactivity
   - Stock validation on checkout

---

## 🛠️ Implementation Phases

### **Phase 1: MVP (Week 1-2)**
✅ Core Features:
- Product CRUD
- Basic categories
- Order placement
- Manual payment (COD + bank transfer)
- Simple seller/buyer dashboard
- Order status tracking

### **Phase 2: Enhancement (Week 3-4)**
✅ Advanced Features:
- Rating & Review system
- Advanced search & filters
- Wishlist
- Shopping cart
- Image upload optimization
- Sales analytics

### **Phase 3: Scale (Future)**
✅ Premium Features:
- Payment gateway integration
- In-app chat
- Promoted listings
- Product recommendations
- Mobile app (React Native)
- Push notifications

---

## 🧪 Testing Checklist

- [ ] Product creation flow
- [ ] Order placement (COD)
- [ ] Order placement (Bank Transfer)
- [ ] Payment verification
- [ ] Order cancellation
- [ ] Order completion
- [ ] Review submission
- [ ] Search & filter functionality
- [ ] Stock management
- [ ] Cart operations
- [ ] Seller dashboard metrics
- [ ] Admin moderation

---

## 📝 Notes

- **Security:** All file uploads must be validated & sanitized
- **Performance:** Implement pagination for product listings (20/page)
- **SEO:** Product URLs should be SEO-friendly: `/marketplace/products/[slug]-[id]`
- **Images:** Store in `/uploads/marketplace/[productId]/[filename]`
- **Notifications:** Email on order status change (Phase 2)
- **Analytics:** Track product views, add-to-cart rate, conversion rate

---

## 🎯 Success Metrics (KPIs)

- Number of active sellers
- Number of products listed
- GMV (Gross Merchandise Value) per month
- Order completion rate
- Average order value
- User engagement (DAU/MAU)
- Seller satisfaction (avg rating)
- Buyer satisfaction (avg rating)

---

**Next Steps:**
1. Review & approve this plan
2. Create database schema migration
3. Implement Product Management (CRUD)
4. Build Order System
5. Develop Seller & Buyer Dashboards
6. Testing & Deployment

---

*Document prepared by: Antigravity AI*
*Date: 2026-01-06*
*Project: UCH Connection - Campus Marketplace*
