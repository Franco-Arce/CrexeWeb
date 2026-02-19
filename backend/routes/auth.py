import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from jose import jwt, JWTError

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET = os.getenv("JWT_SECRET", "crexe_dashboard_secret_key_2026")
ALGORITHM = "HS256"
VALID_USER = "Admin"
VALID_PASS = "Admin123"


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


def create_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode({"sub": username, "exp": expire}, SECRET, algorithm=ALGORITHM)


async def require_auth(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        return payload["sub"]
    except (JWTError, KeyError):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    if body.username == VALID_USER and body.password == VALID_PASS:
        token = create_token(body.username)
        return LoginResponse(token=token, username=body.username)
    raise HTTPException(status_code=401, detail="Credenciales incorrectas")


@router.get("/me")
async def me(user: str = Depends(require_auth)):
    return {"username": user}
