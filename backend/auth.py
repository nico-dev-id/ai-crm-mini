from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "ai-crm-mini-secret-2026"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MENIT = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verifikasi_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def buat_token(data: dict) -> str:
    data_copy = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MENIT)
    data_copy.update({"exp": expire})
    return jwt.encode(data_copy, SECRET_KEY, algorithm=ALGORITHM)

def verifikasi_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None