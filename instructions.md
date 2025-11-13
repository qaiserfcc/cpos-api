# CPOS-API Agent Instructions

## Overview

This is the backend API for the Cloud Point of Sale (CPOS) system, built with Express.js, Node.js, and PostgreSQL. It provides RESTful APIs for managing sales, inventory, customers, and other POS operations in a cloud environment.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma (recommended for type safety and migrations)
- **Authentication**: JWT with bcrypt for password hashing
- **Validation**: Joi or express-validator
- **Logging**: Winston or Morgan
- **Testing**: Jest with Supertest
- **Deployment**: Vercel + Neon PostgreSQL

## Project Structure

```bash
cpos-api/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   └── app.js          # Express app setup
├── prisma/             # Prisma schema and migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
├── tests/              # Unit and integration tests
├── scripts/            # Deployment scripts
│   ├── migrate.js      # Migration runner
│   └── seed.js         # Seed runner
├── initialdb.sql       # Initial database schema
├── vercel.json         # Vercel configuration
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Vercel CLI (`npm install -g vercel`)
- Neon PostgreSQL account and project
- Prisma CLI (`npm install -g prisma`)

### Installation

1. Clone the repository
2. Navigate to the cpos-api directory
3. Install dependencies: `npm install`
4. Set up Neon PostgreSQL database:
   - Create a new project at [neon.tech](https://neon.tech)
   - Get the connection string from the dashboard
5. Initialize Prisma: `npx prisma init`
6. Configure Prisma schema in `prisma/schema.prisma`
7. Set up environment variables (see .env.example)
8. Generate Prisma client: `npx prisma generate`
9. Run initial migration: `npx prisma migrate dev --name init`
10. Run seeds: `npm run seed`
11. Start the development server: `npm run dev`

### Environment Variables

Create a `.env` file with:

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@hostname/dbname?sslmode=require
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

For production, set these in Vercel dashboard:

- `DATABASE_URL`: Your Neon connection string
- `JWT_SECRET`: A secure random string
- `NODE_ENV`: production

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Products

- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales

- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale by ID

### Inventory

- `GET /api/inventory` - Get inventory levels
- `PUT /api/inventory/:productId` - Update inventory

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer

## Database Schema

### Tables

- `users` - User accounts
- `products` - Product catalog
- `sales` - Sales transactions
- `sale_items` - Items in each sale
- `customers` - Customer information
- `inventory` - Stock levels

## Security Considerations

- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use parameterized queries to prevent SQL injection
- Store sensitive data encrypted
- Implement proper CORS policies

## Testing

- Write unit tests for all services
- Integration tests for API endpoints
- Use test database for testing
- Aim for >80% code coverage

## Deployment

### Vercel + Neon Setup

1. **Deploy to Vercel**:

   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables in Vercel**:
   - Go to your project dashboard
   - Navigate to Settings > Environment Variables
   - Add the production environment variables

3. **Database Migration Automation**:
   - Migrations run automatically on each deployment via `vercel.json` build hooks
   - Seeds run automatically after successful migration

4. **Vercel Configuration** (`vercel.json`):

   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install",
     "framework": null,
     "functions": {
       "src/**/*.js": {
         "runtime": "nodejs18.x"
       }
     },
     "build": {
       "env": {
         "NODE_ENV": "production"
       }
     },
     "hooks": {
       "postbuild": "npm run postbuild"
     }
   }
   ```

5. **Package.json Scripts for Automation**:

   ```json
   {
     "scripts": {
       "build": "npm run migrate && npm run seed && npm run build:app",
       "build:app": "your build command",
       "migrate": "node scripts/migrate.js",
       "seed": "node scripts/seed.js",
       "postbuild": "npm run migrate:deploy && npm run seed:deploy"
     }
   }
   ```

6. **Automatic Migration and Seeding**:
   - `scripts/migrate.js`: Handles Prisma migrations
   - `scripts/seed.js`: Runs database seeds
   - Runs on every deployment automatically

### Monitoring

- Use Vercel Analytics for performance monitoring
- Monitor Neon database usage and performance
- Set up error tracking with Sentry or similar
- Implement logging with Vercel Log Drain

## Automatic Migration and Seeding

### How It Works

1. **Build Time**: During Vercel deployment, the build process runs migrations and seeds automatically
2. **Migration Script** (`scripts/migrate.js`):
   - Generates Prisma client
   - Runs `prisma migrate deploy` in production
   - Handles migration failures gracefully
3. **Seed Script** (`scripts/seed.js`):
   - Runs `initialdb.sql` for initial schema setup
   - Executes Prisma seeds if configured
   - Runs custom seed files from `prisma/seeds/`

### Package.json Configuration

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "npm run migrate && npm run build:app",
    "build:app": "your-build-command-here",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js",
    "postbuild": "npm run seed"
  }
}
```

### Prisma Configuration

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models here based on initialdb.sql schema
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  firstName    String?
  lastName     String?
  role         String   @default("user")
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}

// Add other models...
```

### Environment Variables for Automation

Set these in Vercel for automatic execution:

- `DATABASE_URL`: Your Neon connection string
- `RUN_SEEDS`: Set to "true" to run seeds on deployment
- `NODE_ENV`: Automatically set to "production" by Vercel

### Manual Override

If you need to run migrations/seeds manually:

```bash
# Run migrations only
npm run migrate

# Run seeds only
npm run seed

# Run both
npm run migrate && npm run seed
```

## Best Practices

- Follow RESTful API conventions
- Use consistent error handling
- Implement pagination for large datasets
- Use caching for frequently accessed data
- Document all endpoints with OpenAPI/Swagger
- Version the API properly

## Integration with CPOS-Web

The frontend (cpos-web) will consume these APIs. Ensure CORS is configured to allow requests from the frontend domain. Use JWT tokens for authentication between frontend and backend.
