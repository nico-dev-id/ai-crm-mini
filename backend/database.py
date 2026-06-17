import os
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:admin123@localhost:5432/crm_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Tabel users
class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    customers = relationship("CustomerModel", back_populates="user")

# Tabel customers
class CustomerModel(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nama = Column(String, nullable=False)
    email = Column(String, nullable=True)
    telepon = Column(String, nullable=True)
    perusahaan = Column(String, nullable=True)
    status = Column(String, default="prospect")  # prospect, active, inactive
    catatan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("UserModel", back_populates="customers")
    deals = relationship("DealModel", back_populates="customer", cascade="all, delete-orphan")

# Tabel deals
class DealModel(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    judul = Column(String, nullable=False)
    nilai = Column(Float, default=0)
    status = Column(String, default="open")  # open, won, lost
    catatan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    customer = relationship("CustomerModel", back_populates="deals")

Base.metadata.create_all(bind=engine)
print("Database CRM siap!")