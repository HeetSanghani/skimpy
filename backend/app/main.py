from fastapi import FastAPI
from app.api.v1.routes import auth,users,categories,products,vendors
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

origins = [
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   # allow all HTTP methods
    allow_headers=["*"],   # allow all headers
)

app.include_router(auth.router) 
app.include_router(users.router) 
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(vendors.router)
