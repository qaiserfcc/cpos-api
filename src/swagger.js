const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CPOS API',
    version: '1.0.0',
    description: 'Cloud Point of Sale (CPOS) REST API',
    contact: {
      name: 'CPOS Team',
      email: 'support@cpos.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://cpos-api.vercel.app',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the user'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          firstName: {
            type: 'string',
            description: 'User first name'
          },
          lastName: {
            type: 'string',
            description: 'User last name'
          },
          role: {
            type: 'string',
            enum: ['admin', 'manager', 'user'],
            description: 'User role'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the user account is active'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          }
        }
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the product'
          },
          name: {
            type: 'string',
            description: 'Product name'
          },
          description: {
            type: 'string',
            description: 'Product description'
          },
          sku: {
            type: 'string',
            description: 'Stock Keeping Unit'
          },
          barcode: {
            type: 'string',
            description: 'Product barcode'
          },
          categoryId: {
            type: 'string',
            format: 'uuid',
            description: 'Category ID'
          },
          price: {
            type: 'number',
            format: 'decimal',
            description: 'Product price'
          },
          cost: {
            type: 'number',
            format: 'decimal',
            description: 'Product cost'
          },
          taxRate: {
            type: 'number',
            format: 'decimal',
            description: 'Tax rate percentage'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the product is active'
          }
        }
      },
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the category'
          },
          name: {
            type: 'string',
            description: 'Category name'
          },
          description: {
            type: 'string',
            description: 'Category description'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the category is active'
          }
        }
      },
      Customer: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the customer'
          },
          firstName: {
            type: 'string',
            description: 'Customer first name'
          },
          lastName: {
            type: 'string',
            description: 'Customer last name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Customer email'
          },
          phone: {
            type: 'string',
            description: 'Customer phone number'
          },
          address: {
            type: 'string',
            description: 'Customer address'
          },
          city: {
            type: 'string',
            description: 'Customer city'
          },
          state: {
            type: 'string',
            description: 'Customer state'
          },
          zipCode: {
            type: 'string',
            description: 'Customer zip code'
          },
          country: {
            type: 'string',
            description: 'Customer country'
          },
          loyaltyPoints: {
            type: 'integer',
            description: 'Customer loyalty points'
          },
          totalPurchases: {
            type: 'number',
            format: 'decimal',
            description: 'Total purchase amount'
          }
        }
      },
      Sale: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the sale'
          },
          customerId: {
            type: 'string',
            format: 'uuid',
            description: 'Customer ID'
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID who created the sale'
          },
          totalAmount: {
            type: 'number',
            format: 'decimal',
            description: 'Total sale amount'
          },
          taxAmount: {
            type: 'number',
            format: 'decimal',
            description: 'Tax amount'
          },
          discountAmount: {
            type: 'number',
            format: 'decimal',
            description: 'Discount amount'
          },
          paymentMethodId: {
            type: 'string',
            format: 'uuid',
            description: 'Payment method ID'
          },
          paymentStatusId: {
            type: 'string',
            format: 'uuid',
            description: 'Payment status ID'
          },
          saleStatusId: {
            type: 'string',
            format: 'uuid',
            description: 'Sale status ID'
          },
          notes: {
            type: 'string',
            description: 'Sale notes'
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SaleItem'
            },
            description: 'Sale items'
          }
        }
      },
      SaleItem: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            format: 'uuid',
            description: 'Product ID'
          },
          quantity: {
            type: 'integer',
            description: 'Quantity sold'
          },
          unitPrice: {
            type: 'number',
            format: 'decimal',
            description: 'Unit price'
          },
          discount: {
            type: 'number',
            format: 'decimal',
            description: 'Discount per item'
          },
          taxAmount: {
            type: 'number',
            format: 'decimal',
            description: 'Tax amount'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Swagger options
const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/app.js'] // Paths to files containing OpenAPI definitions
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    syntaxHighlight: {
      activate: true,
      theme: 'arta'
    },
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Add authorization header if token exists in localStorage
      const token = localStorage.getItem('token');
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
      return req;
    }
  }
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions
};