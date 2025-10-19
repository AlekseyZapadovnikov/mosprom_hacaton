import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from config import SECRET_KEY, supabase, logger
from models import UserCreate, UserLogin, UserType

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# --- JWT и Зависимости ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")


def verify_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    return verify_token(token)


def get_current_moderator(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_type") != UserType.moderator:
        raise HTTPException(status_code=403, detail="Requires moderator privileges")
    return current_user


@router.post("/register")
async def register(user: UserCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Сбой регистрации. Попробуйте повторить позже.")

        profile_data = {
            "id": auth_response.user.id,
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type.value
        }

        if user.user_type == UserType.company:
            profile_data.update({
                "company_name": user.company_name,
                "inn": user.inn,
                "company_website": user.company_website
            })

        supabase.table("users").insert(profile_data).execute()

        token_payload = {
            "sub": str(auth_response.user.id),
            "email": user.email,
            "user_type": user.user_type.value
        }
        token = create_access_token(token_payload)

        return {"access_token": token, "token_type": "bearer", "user": profile_data}

    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        if hasattr(e, 'code') and e.code == "23505":
            raise HTTPException(status_code=400, detail="Аккаунт с таким email уже существует.")
        raise HTTPException(status_code=400, detail="Ошибка при регистрации: " + str(e))


@router.post("/login")
async def login(credentials: UserLogin):
    if not supabase:
        raise HTTPException(status_code=500, detail="Ошибка базы данных")
    try:
        auth_response = supabase.auth.sign_in_with_password(
            {"email": credentials.email, "password": credentials.password})
        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Неправильные данные для входа")
        user_data = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        if not user_data.data:
            raise HTTPException(status_code=404, detail="Профиля с такими данными не существует")
        user_profile = user_data.data[0]
        token = create_access_token(
            {"sub": str(auth_response.user.id), "email": credentials.email, "user_type": user_profile.get("user_type")})
        return {"access_token": token, "token_type": "bearer", "user": user_profile}
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail=str(e))