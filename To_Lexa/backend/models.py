from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


# --- Модели данных ---

class UserType(str, Enum):
    student = "student"
    company = "company"
    university = "university"
    moderator = "moderator"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str  # Для компании это будет ФИО представителя
    user_type: UserType

    # Новые поля для компании. Они необязательны на уровне модели,
    # так как для студента они не нужны.
    company_name: Optional[str] = None
    inn: Optional[str] = None
    company_website: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @model_validator(mode='after')
    def check_company_fields(self):
        """
        Проверяет, что если тип пользователя 'company', то поля
        company_name и inn обязательны.
        """
        if self.user_type == UserType.company:

            # Точно так же для других полей
            if not self.company_name:
                raise ValueError("Название компании является обязательным полем.")
            if not self.inn:
                raise ValueError("ИНН является обязательным полем.")

        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class StudentProfile(BaseModel):
    user_id: str
    university: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: Optional[List[str]] = []
    bio: Optional[str] = None


class Resume(BaseModel):
    student_id: str
    title: str
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[List[str]] = []
    languages: Optional[List[str]] = []
    achievements: Optional[str] = None


class ResumeUpdate(BaseModel):
    title: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    achievements: Optional[str] = None


class Vacancy(BaseModel):
    company_id: str
    title: str
    description: str
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    employment_type: str
    is_internship: bool = False


class CompanyProfile(BaseModel):
    user_id: str
    company_name: str
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    size: Optional[str] = None


class UniversityProfile(BaseModel):
    user_id: str
    university_name: str
    description: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None


class Appointment(BaseModel):
    student_id: str
    company_id: Optional[str] = None
    appointment_date: datetime
    appointment_type: str
    notes: Optional[str] = None


class ChatMessage(BaseModel):
    sender_id: str
    receiver_id: Optional[str] = None
    message: str
    chat_type: str


class AIQuery(BaseModel):
    query: str
    user_id: str


class VacancyTouch(BaseModel):
    id: str
    vacancy_id: str
    student_id: str
    resume_id: Optional[str] = None  # ID резюме студента (если выбрано)
    additional_info: Optional[str] = None  # Дополнительный текст для этой вакансии
    status: str = "pending"  # Статус: pending, viewed, accepted, rejected

class VacancyTouchCreate(BaseModel):
    vacancy_id: str
    student_id: str
    resume_id: Optional[str] = None
    additional_info: Optional[str] = None


