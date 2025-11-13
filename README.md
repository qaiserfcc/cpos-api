# CPOS-API

Cloud Point of Sale (CPOS) Backend API - A scalable, modular REST API built with Express.js, Node.js, and PostgreSQL, deployed on Vercel with Neon database.

## 🚀 Features

- **RESTful API** for Point of Sale operations
- **Authentication & Authorization** with JWT
- **PostgreSQL Database** with Prisma ORM
- **Automatic Migrations & Seeding** on deployment
- **Cloud Deployment** on Vercel + Neon
- **Real-time Inventory** management
- **Sales & Customer** tracking
- **Comprehensive Logging** and error handling

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Deployment**: Vercel
- **Validation**: Joi
- **Testing**: Jest + Supertest

## 📋 Prerequisites

- Node.js 18 or higher
- Vercel CLI (`npm install -g vercel`)
- Neon PostgreSQL account
- Prisma CLI (`npm install -g prisma`)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cpos-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Neon Database**
   - Create account at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and JWT_SECRET
   ```

5. **Initialize Prisma**
   ```bash
   npx prisma init
   npx prisma generate
   ```

6. **Run initial setup**
   ```bash
   npm run migrate
   npm run seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

## 📦 Deployment

### Automatic Deployment to Vercel

1. **Connect to Vercel**
   ```bash
   vercel login
   vercel link
   ```

2. **Configure Environment Variables**
   - Set `DATABASE_URL` in Vercel dashboard
   - Set `JWT_SECRET` for production
   - Set `RUN_SEEDS=true` to run seeds on deployment

3. **Deploy**
   ```bash
   vercel --prod
   ```

### What Happens on Deployment

- **Build**: Installs dependencies and generates Prisma client
- **Migrate**: Runs database migrations automatically
- **Seed**: Runs database seeds (if `RUN_SEEDS=true`)
- **Deploy**: Deploys the API to Vercel

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Product Management
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales Management
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details

### Inventory & Customers
- `GET /api/inventory` - Get inventory levels
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer

## 🗄️ Database Schema

The database includes tables for:
- **Users**: Authentication and user management
- **Products**: Product catalog and pricing
- **Sales**: Transaction records
- **Sale Items**: Individual items in transactions
- **Customers**: Customer information and loyalty
- **Inventory**: Stock levels and locations

See `initialdb.sql` for the complete schema.

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run migrate` - Run database migrations
- `npm run seed` - Run database seeds
- `npm test` - Run tests

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `RUN_SEEDS` | Run seeds on deployment (true/false) | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or support, please open an issue in the repository.
