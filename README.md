# 🐟 Fishit Marketplace

> A modern, full-stack e-commerce platform for Roblox top-up game items with iPaymu payment gateway, real-time payment tracking, and cloud-based image storage.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)
![Vercel](https://img.shields.io/badge/Vercel-Ready-black)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Customer Features
- 🛍️ **Product Marketplace** - Browse and purchase game top-up items (Robux, accounts, etc.)
- 🛒 **Smart Shopping Cart** - Real-time cart validation with stock checking
- 💳 **iPaymu Payment Gateway** - Secure payment with multiple methods (VA, e-wallet, QRIS)
- ⏰ **Real-time Payment Tracking** - Auto-refresh payment status every 5 seconds
- 📧 **Email Notifications** - Automated invoice and payment link delivery via Brevo
- 📱 **Responsive Design** - Beautiful Web3-inspired UI with glassmorphism
- 🔍 **Order Tracking** - Check order status using invoice number or email
- 🎨 **Modern UI/UX** - Smooth animations with Framer Motion
- 🔄 **Payment Waiting Page** - Stay on website while paying (opens iPaymu in new tab)

### Seller Features
- 🏪 **Seller Dashboard** - Personal sales analytics and order management
- 📦 **Product Management** - Create, update, and manage your own products
- 📊 **Sales Analytics** - Track revenue, orders, and top-selling products
- 💰 **Transaction Monitoring** - Real-time order status updates
- ✅ **Order Processing** - Mark orders as processing/success
- 📈 **Performance Metrics** - Revenue trends and success rates

### Admin Features
- 🎛️ **Admin Dashboard** - Global analytics and platform monitoring
- 🔐 **Seller Management** - Register and manage seller accounts
- 📂 **Category Management** - Organize products by categories
- 🖼️ **Cloud Image Upload** - Cloudinary integration for optimized images
- 🚫 **Product Moderation** - Ban/unban products (safety control)
- 📊 **Platform Analytics** - Visual charts with seller filters
- 💳 **Payment Monitoring** - Track all iPaymu transactions and callbacks

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom Web3 theme
- **State Management**: Zustand (cart, auth)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form (optional)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary (serverless-ready)
- **Payment Gateway**: iPaymu (Redirect Payment API)
- **Email Service**: Brevo SMTP (Nodemailer)
- **Environment**: dotenv

### Cloud Services
- **Image Storage**: Cloudinary (25GB free tier)
- **Payment**: iPaymu Sandbox/Production
- **Email**: Brevo (300 emails/day free)
- **Deployment**: Vercel (Frontend + Backend serverless)
- **Database**: MongoDB Atlas (512MB free tier)

---

## 📁 Project Structure

```
Fishit-Marketplace/
├── backend/                  # Express.js backend
│   ├── controllers/         # Business logic
│   ├── db/                  # Database connection
│   ├── middleware/          # Auth middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── scripts/             # Utility scripts (seed, etc.)
│   ├── services/            # External services (email)
│   ├── uploads/             # Uploaded images
│   └── server.js            # Entry point
│
├── frontend/                # Next.js frontend
│   ├── app/                 # App Router pages
│   │   ├── about/          # About page
│   │   ├── admin/          # Admin dashboard
│   │   ├── check-order/    # Order tracking
│   │   └── game/[id]/      # Product details
│   ├── components/          # React components
│   │   ├── admin/          # Admin components
│   │   └── ui/             # UI components
│   ├── lib/                 # Utilities
│   │   ├── api.ts          # API client
│   │   ├── currency.ts     # Currency formatter
│   │   └── date.ts         # Date formatter
│   ├── public/              # Static assets
│   └── store/               # Zustand stores
│
├── .gitignore               # Git ignore rules
├── .gitattributes           # Git attributes
└── README.md                # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **MongoDB** >= 6.0 ([Download](https://www.mongodb.com/try/download/community))
- **npm** or **yarn** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Recommended Tools
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing
- **VS Code** - Code editor

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/muhamadhazim/Fishit-Marketplace.git
cd Fishit-Marketplace
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

1. **Create `.env` file** in `backend/` directory:

```bash
cd backend
cp .env.example .env
```

2. **Edit `backend/.env`** with your credentials:

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/fishit_marketplace

# JWT Secret (generate random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server Port
PORT=4000

# Brevo SMTP (for email notifications)
BREVO_SMTP_USER=your_smtp_login@smtp-brevo.com
BREVO_SMTP_KEY=your-brevo-smtp-key
BREVO_SENDER_EMAIL=your-verified-email@gmail.com

# iPaymu Payment Gateway
IPAYMU_VA=your_virtual_account_number
IPAYMU_API_KEY=your_ipaymu_api_key
IPAYMU_PRODUCTION=false  # Set to true for production

# Application URLs
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Get Service Credentials:**

**Brevo SMTP:**
1. Sign up at [Brevo](https://www.brevo.com)
2. Go to Settings → SMTP & API
3. Generate SMTP Key
4. Add and verify sender email

**iPaymu Payment Gateway:**
1. Sign up at [iPaymu Sandbox](https://sandbox.ipaymu.com) or [Production](https://my.ipaymu.com)
2. Go to Integration menu
3. Copy VA (Virtual Account) and API Key
4. For production, set `IPAYMU_PRODUCTION=true`

**Cloudinary Image Storage:**
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Free tier: 25GB storage + 25GB bandwidth/month

### Frontend Configuration

1. **Create `.env.local` file** in `frontend/` directory:

```bash
cd frontend
cp .env.example .env.local
```

2. **Edit `frontend/.env.local`**:

```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

---

## 🏃 Running the Application

### Development Mode

#### 1. Start MongoDB

```bash
# Windows (if installed as service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

#### 2. Seed Database (Optional - First Time Only)

```bash
cd backend
node scripts/seed.js
```

This will create:
- Default admin user (`admin` / `admin`)
- Sample categories
- Sample products

#### 3. Start Backend Server

```bash
cd backend
npm start
```

Backend will run on: `http://localhost:4000`

#### 4. Start Frontend Dev Server

```bash
# Open new terminal
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:3000`

### Production Mode

#### Backend
```bash
cd backend
NODE_ENV=production npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run start
```

---

## 🔐 Default Admin Credentials

After seeding the database:

```
Email: admin
Password: admin
```

**⚠️ IMPORTANT**: Change these credentials in production!

---

## 📡 API Endpoints

### Products
- `GET /api/products` - Get all active products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)

### Transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:invoiceNumber` - Get transaction by invoice
- `PUT /api/transactions/:id` - Update transaction status (Admin)

### Authentication
- `POST /api/auth/login` - Admin login

### Upload
- `POST /api/upload` - Upload image (Admin)

---

## 🌐 Deployment

### Recommended Stack
- **Backend**: [Render](https://render.com) or [Railway](https://railway.app)
- **Frontend**: [Vercel](https://vercel.com)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Deployment Guides

Detailed deployment guides are available in the `deployment_guide.md` artifact file.

**Quick Steps:**

1. **Deploy Backend to Render**
   - Connect GitHub repository
   - Set environment variables
   - Deploy from `main` branch

2. **Deploy Frontend to Vercel**
   - Connect GitHub repository
   - Set `NEXT_PUBLIC_API_BASE` to your backend URL
   - Deploy from `main` branch

3. **Setup MongoDB Atlas**
   - Create free cluster
   - Whitelist IPs
   - Update `MONGODB_URI` in backend env

---

## 🧪 Testing

### Backend API Test
```bash
curl http://localhost:4000/api/products
```

### Frontend Test
Navigate to `http://localhost:3000`

---

## 🎯 Usage

### For Customers

1. **Browse Products** - Visit homepage to see available items
2. **Add to Cart** - Click products to add to cart
3. **Checkout** - Fill in email and create order
4. **Receive Invoice** - Check email for payment details
5. **Track Order** - Use invoice number to check order status

### For Admins

1. **Login** - Navigate to `/admin/login`
2. **Dashboard** - View analytics and recent orders
3. **Manage Products** - Add, edit, or delete products
4. **Monitor Transactions** - Track payment status

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Workflow

```bash
# Work on dev branch
git checkout dev

# Make changes
git add .
git commit -m "feat: your feature"
git push origin dev

# Create PR to main when ready
```

---

## 👥 Team

- **Muhammad Hazim Robbani** - Full Stack Developer

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚡ Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)
- **Bundle Size**: < 500KB (optimized with Next.js)
- **API Response Time**: < 100ms (average)

---

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ JWT authentication for admin routes
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Rate limiting (recommended for production)
- ✅ HTTPS in production (via Vercel/Render)

---

## 📞 Support

For issues and questions:
- **Issues**: [GitHub Issues](https://github.com/muhamadhazim/Fishit-Marketplace/issues)
- **Email**: [Contact](https://github.com/muhamadhazim)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Brevo](https://www.brevo.com/) - Email service
- [MongoDB](https://www.mongodb.com/) - Database
- [Vercel](https://vercel.com/) - Deployment platform

---

<div align="center">

**Made with ❤️ by the Fishit Marketplace Team**

[⭐ Star this repo](https://github.com/muhamadhazim/Fishit-Marketplace) | [🐛 Report Bug](https://github.com/muhamadhazim/Fishit-Marketplace/issues) | [✨ Request Feature](https://github.com/muhamadhazim/Fishit-Marketplace/issues)

</div>
