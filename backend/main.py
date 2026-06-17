import os
import json
import redis
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from database import SessionLocal, UserModel, CustomerModel, DealModel
from auth import hash_password, verifikasi_password, buat_token, verifikasi_token
from groq import Groq

load_dotenv()

app = FastAPI(title="AI CRM Mini")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Redis client
try:
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    print(f"Connecting to Redis: {redis_url}")
    redis_client = redis.from_url(redis_url)
    redis_client.ping()
    print("Redis terhubung!")
except Exception as e:
    print(f"Redis error: {e}")
    redis_client = None
    print("Redis tidak tersedia, cache dinonaktifkan")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verifikasi_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token tidak valid!")
    user = db.query(UserModel).filter(UserModel.email == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan!")
    return user

# Schemas
class RegisterInput(BaseModel):
    nama: str
    email: str
    password: str

class CustomerInput(BaseModel):
    nama: str
    email: Optional[str] = None
    telepon: Optional[str] = None
    perusahaan: Optional[str] = None
    status: Optional[str] = "prospect"
    catatan: Optional[str] = None

class DealInput(BaseModel):
    judul: str
    nilai: Optional[float] = 0
    status: Optional[str] = "open"
    catatan: Optional[str] = None

# ==================
# AUTH ENDPOINTS
# ==================

@app.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar!")
    user_baru = UserModel(
        nama=data.nama,
        email=data.email,
        password=hash_password(data.password)
    )
    db.add(user_baru)
    db.commit()
    db.refresh(user_baru)
    return {"pesan": "Registrasi berhasil!", "nama": user_baru.nama}

@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == form.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email tidak ditemukan!")
    if not verifikasi_password(form.password, user.password):
        raise HTTPException(status_code=401, detail="Password salah!")
    token = buat_token({"sub": user.email, "nama": user.nama})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/profil")
def profil(current_user: UserModel = Depends(get_current_user)):
    return {"nama": current_user.nama, "email": current_user.email}

# ==================
# CUSTOMER ENDPOINTS
# ==================

@app.post("/customers")
def tambah_customer(data: CustomerInput, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = CustomerModel(
        user_id=current_user.id,
        nama=data.nama,
        email=data.email,
        telepon=data.telepon,
        perusahaan=data.perusahaan,
        status=data.status,
        catatan=data.catatan
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return {"pesan": "Customer berhasil ditambahkan!", "customer": {
        "id": customer.id,
        "nama": customer.nama,
        "perusahaan": customer.perusahaan,
        "status": customer.status
    }}

@app.get("/customers")
def get_customers(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    customers = db.query(CustomerModel).filter(
        CustomerModel.user_id == current_user.id
    ).all()
    return {
        "total": len(customers),
        "customers": [
            {
                "id": c.id,
                "nama": c.nama,
                "email": c.email,
                "telepon": c.telepon,
                "perusahaan": c.perusahaan,
                "status": c.status,
                "catatan": c.catatan,
                "created_at": c.created_at,
                "total_deals": len(c.deals),
                "total_nilai": sum(d.nilai for d in c.deals)
            } for c in customers
        ]
    }

@app.get("/customers/{customer_id}")
def get_customer(customer_id: int, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.user_id == current_user.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan!")
    return {
        "id": customer.id,
        "nama": customer.nama,
        "email": customer.email,
        "telepon": customer.telepon,
        "perusahaan": customer.perusahaan,
        "status": customer.status,
        "catatan": customer.catatan,
        "created_at": customer.created_at,
        "deals": [
            {
                "id": d.id,
                "judul": d.judul,
                "nilai": d.nilai,
                "status": d.status,
                "catatan": d.catatan,
                "created_at": d.created_at
            } for d in customer.deals
        ]
    }

@app.put("/customers/{customer_id}")
def update_customer(customer_id: int, data: CustomerInput, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.user_id == current_user.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan!")
    
    customer.nama = data.nama
    customer.email = data.email
    customer.telepon = data.telepon
    customer.perusahaan = data.perusahaan
    customer.status = data.status
    customer.catatan = data.catatan
    db.commit()
    
    # Hapus cache AI untuk customer ini
    if redis_client:
        redis_client.delete(f"ai_analysis:customer:{customer_id}")
    
    return {"pesan": "Customer berhasil diupdate!"}

@app.delete("/customers/{customer_id}")
def hapus_customer(customer_id: int, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.user_id == current_user.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan!")
    
    if redis_client:
        redis_client.delete(f"ai_analysis:customer:{customer_id}")
    
    db.delete(customer)
    db.commit()
    return {"pesan": f"Customer {customer.nama} berhasil dihapus!"}

# ==================
# DEAL ENDPOINTS
# ==================

@app.post("/customers/{customer_id}/deals")
def tambah_deal(customer_id: int, data: DealInput, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.user_id == current_user.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan!")
    
    deal = DealModel(
        user_id=current_user.id,
        customer_id=customer_id,
        judul=data.judul,
        nilai=data.nilai,
        status=data.status,
        catatan=data.catatan
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    
    # Hapus cache AI karena ada deal baru
    if redis_client:
        redis_client.delete(f"ai_analysis:customer:{customer_id}")
    
    return {"pesan": "Deal berhasil ditambahkan!", "deal": {
        "id": deal.id,
        "judul": deal.judul,
        "nilai": deal.nilai,
        "status": deal.status
    }}

@app.put("/customers/{customer_id}/deals/{deal_id}")
def update_deal(customer_id: int, deal_id: int, data: DealInput, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    deal = db.query(DealModel).filter(
        DealModel.id == deal_id,
        DealModel.customer_id == customer_id,
        DealModel.user_id == current_user.id
    ).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal tidak ditemukan!")
    
    deal.judul = data.judul
    deal.nilai = data.nilai
    deal.status = data.status
    deal.catatan = data.catatan
    db.commit()
    
    if redis_client:
        redis_client.delete(f"ai_analysis:customer:{customer_id}")
    
    return {"pesan": "Deal berhasil diupdate!"}

@app.delete("/customers/{customer_id}/deals/{deal_id}")
def hapus_deal(customer_id: int, deal_id: int, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    deal = db.query(DealModel).filter(
        DealModel.id == deal_id,
        DealModel.customer_id == customer_id,
        DealModel.user_id == current_user.id
    ).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal tidak ditemukan!")
    
    db.delete(deal)
    db.commit()
    
    if redis_client:
        redis_client.delete(f"ai_analysis:customer:{customer_id}")
    
    return {"pesan": "Deal berhasil dihapus!"}

# ==================
# AI ENDPOINTS
# ==================

@app.get("/customers/{customer_id}/analyze")
def analyze_customer(customer_id: int, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    # Cek cache Redis dulu
    cache_key = f"ai_analysis:customer:{customer_id}:user:{current_user.id}"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            print("Ambil dari cache Redis!")
            return json.loads(cached)
    
    # Ambil data customer
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.user_id == current_user.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan!")
    
    # Siapkan data untuk AI
    deals_info = "\n".join([
        f"- {d.judul}: Rp {d.nilai:,.0f} ({d.status})"
        for d in customer.deals
    ]) or "Belum ada deal"
    
    total_nilai = sum(d.nilai for d in customer.deals)
    won_deals = len([d for d in customer.deals if d.status == "won"])
    
    prompt = f"""Kamu adalah analis CRM profesional. Analisis customer berikut dan berikan insight bisnis.

Data Customer:
- Nama: {customer.nama}
- Perusahaan: {customer.perusahaan or 'Tidak ada'}
- Status: {customer.status}
- Catatan: {customer.catatan or 'Tidak ada'}

Riwayat Deals:
{deals_info}

Statistik:
- Total deals: {len(customer.deals)}
- Deal berhasil (won): {won_deals}
- Total nilai: Rp {total_nilai:,.0f}

Berikan analisis dalam format:
1. Ringkasan profil customer
2. Potensi bisnis (tinggi/sedang/rendah) dan alasannya
3. Rekomendasi tindakan konkret (minimal 3 poin)
4. Prediksi kemungkinan deal berikutnya

Jawab dalam bahasa Indonesia, profesional dan actionable."""

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    
    hasil = {
        "customer_id": customer_id,
        "nama": customer.nama,
        "analisis": response.choices[0].message.content,
        "cached": False
    }
    
    # Simpan ke Redis cache (expire 1 jam)
    if redis_client:
        redis_client.setex(cache_key, 3600, json.dumps(hasil))
    
    hasil["cached"] = False
    return hasil

# ==================
# DASHBOARD ENDPOINT
# ==================

@app.get("/dashboard")
def get_dashboard(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    customers = db.query(CustomerModel).filter(CustomerModel.user_id == current_user.id).all()
    deals = db.query(DealModel).filter(DealModel.user_id == current_user.id).all()
    
    total_nilai = sum(d.nilai for d in deals)
    won_nilai = sum(d.nilai for d in deals if d.status == "won")
    
    return {
        "total_customers": len(customers),
        "prospect": len([c for c in customers if c.status == "prospect"]),
        "active": len([c for c in customers if c.status == "active"]),
        "inactive": len([c for c in customers if c.status == "inactive"]),
        "total_deals": len(deals),
        "open_deals": len([d for d in deals if d.status == "open"]),
        "won_deals": len([d for d in deals if d.status == "won"]),
        "lost_deals": len([d for d in deals if d.status == "lost"]),
        "total_nilai": total_nilai,
        "won_nilai": won_nilai,
    }