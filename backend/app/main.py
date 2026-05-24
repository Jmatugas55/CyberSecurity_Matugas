from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, login_attempts, password, email, face, doctors, appointments

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hospital Auth & Booking System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(login_attempts.router)
app.include_router(password.router)
app.include_router(email.router)
app.include_router(face.router)
app.include_router(doctors.router)
app.include_router(appointments.router)


@app.get("/")
def home():
    return {"message": "Hospital Auth & Booking System"}
