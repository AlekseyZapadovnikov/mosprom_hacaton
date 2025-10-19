import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Импорт конфигурации и роутеров
from config import supabase, openai_client
from auth import router as auth_router
from api import router as api_router
from spa import router as spa_router

# --- Инициализация приложения FastAPI ---
app = FastAPI(title="Карьерный центр Технополис Москва")

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Подключение статических файлов ---
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Подключение роутеров ---
app.include_router(auth_router)
app.include_router(api_router)
app.include_router(spa_router) # SPA роутер должен быть последним

# --- Запуск ---
if __name__ == "__main__":
    print("🚀 Запуск Карьерного центра Технополис Москва")
    print(f"📊 Supabase подключен: {supabase is not None}")
    print(f"🤖 OpenAI настроен: {openai_client is not None}")
    print("🌐 Сервер доступен на http://localhost:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)