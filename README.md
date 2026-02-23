File Structure


marketplace-app/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── routes/
│   │   │   │   │   ├── auth.py              # login, register, JWT
│   │   │   │   │   ├── users.py             # profile mgmt
│   │   │   │   │   ├── products.py          # CRUD for products
│   │   │   │   │   ├── categories.py        # category tree
│   │   │   │   │   ├── search.py            # text search & filters
│   │   │   │   │   ├── messaging.py         # chat system
│   │   │   │   │   ├── orders.py            # transactions
│   │   │   │   │   └── uploads.py           # image upload/resize
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py                    # settings (env vars)
│   │   │   ├── security.py                  # JWT, password hashing
│   │   │   ├── rate_limiter.py              # API rate limiting
│   │   │   └── events.py                    # startup/shutdown events
│   │   │
│   │   ├── db/
│   │   │   ├── mongodb.py                   # MongoDB connection (Motor)
│   │   │   ├── kafka.py                     # Kafka producer/consumer
│   │   │   └── models/                      # MongoDB document models
│   │   │       ├── user.py
│   │   │       ├── product.py
│   │   │       ├── category.py
│   │   │       ├── order.py
│   │   │       ├── message.py
│   │   │       └── __init__.py
│   │   │
│   │   ├── schemas/                         # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── category.py
│   │   │   ├── order.py
│   │   │   ├── message.py
│   │   │   └── auth.py
│   │   │
│   │   ├── services/                        # Business logic layer
│   │   │   ├── image_service.py             # resize, compress images
│   │   │   ├── search_service.py            # Mongo full-text search
│   │   │   ├── messaging_service.py         # chat logic
│   │   │   ├── order_service.py             # order workflows
│   │   │   └── payment_service.py           # payment integration prep
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.py                    # app logging
│   │   │   ├── helpers.py                   # misc utils
│   │   │   └── validators.py                # input sanitization
│   │   │
│   │   ├── main.py                          # FastAPI entry point
│   │   └── __init__.py
│   │
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── api/                             # Axios services
│   │   │   ├── authApi.js
│   │   │   ├── productApi.js
│   │   │   ├── messageApi.js
│   │   │   └── orderApi.js
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── CategoryTree.jsx
│   │   │   ├── ImageCarousel.jsx
│   │   │   ├── ChatBox.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── CreateProduct.jsx            # multi-step form
│   │   │   ├── Dashboard.jsx                # seller/buyer dashboard
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Profile.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useChat.js
│   │   │   └── useSearch.js
│   │   │
│   │   │
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   └── formatters.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── routes.js
│   │
│   ├── package.json
│   ├── vite.config.js / webpack.config.js
│   └── README.md
│
├── docker-compose.yml                      # backend, frontend, mongodb, kafka, zookeeper
└── README.md

## n8n on Render (503 "Database is not ready")

If n8n at https://skimpy-n8n.onrender.com/ shows **503 – Database is not ready**, add a PostgreSQL database and set the DB env vars on the n8n service. See **backend/docs/N8N_RENDER_SETUP.md** for step-by-step instructions.
