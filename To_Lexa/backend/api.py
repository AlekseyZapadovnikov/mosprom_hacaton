from cryptography.hazmat.backends.openssl import backend
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import date, datetime, timedelta
from enum import Enum
import json

from config import supabase, openai_client, logger
from models import (
    StudentProfile, Resume, Vacancy, CompanyProfile, UniversityProfile,
    Appointment, ChatMessage, AIQuery, ResumeUpdate, VacancyTouch, VacancyTouchCreate
)
from auth import get_current_user, get_current_moderator

router = APIRouter(prefix="/api", tags=["API"])

# --- Health Check ---
@router.get("/health")
async def health_check():
    return {"status": "healthy", "supabase_connected": supabase is not None, "openai_configured": openai_client is not None}

# --- Поиск Кандидатов для Работодателей ---
@router.get("/candidates/search")
async def search_candidates(
    current_user: dict = Depends(get_current_user),
    skills: Optional[str] = Query(None, description="Навыки через запятую, например: Python,SQL,FastAPI"),
    major: Optional[str] = Query(None, description="Специальность (частичное совпадение)"),
    university: Optional[str] = Query(None, description="Университет (частичное совпадение)"),
    grad_year_from: Optional[int] = Query(None, description="Год выпуска, от"),
    grad_year_to: Optional[int] = Query(None, description="Год выпуска, до")
):
    # ... (код эндпоинта search_candidates)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("user_type") != 'company': raise HTTPException(status_code=403, detail="Access denied: for company accounts only")
    company_user_id = current_user.get("sub")
    try:
        query = supabase.table("student_profiles").select("*, users(full_name, email)")
        if skills:
            skills_list = [skill.strip() for skill in skills.split(',')]
            query = query.cs("skills", skills_list)
        if major:
            query = query.ilike("major", f"%{major}%")
        if university:
            query = query.ilike("university", f"%{university}%")
        if grad_year_from:
            query = query.gte("graduation_year", grad_year_from)
        if grad_year_to:
            query = query.lte("graduation_year", grad_year_to)

        candidates_response = query.execute()
        if not candidates_response.data: return []
        
        candidates = candidates_response.data
        
        company_vacancies_req = supabase.table("vacancies").select("id").eq("company_id", company_user_id).execute()
        company_vacancy_ids = [v['id'] for v in company_vacancies_req.data]

        if not company_vacancy_ids:
            for candidate in candidates: candidate['my_company_responses'] = []
            return candidates

        candidate_ids = [c['user_id'] for c in candidates]
        
        responses_req = supabase.table("vacancy_responses").select("student_id, vacancy_id, vacancies(title)").in_("student_id", candidate_ids).in_("vacancy_id", company_vacancy_ids).execute()

        responses_map = {}
        for resp in responses_req.data:
            if resp['student_id'] not in responses_map: responses_map[resp['student_id']] = []
            responses_map[resp['student_id']].append({
                "vacancy_id": resp['vacancy_id'],
                "vacancy_title": resp['vacancies']['title'] if resp.get('vacancies') else 'Unknown',
                "additional_info": resp.get('additional_info', 'соискатель не указал дополнительной информации')
            })
        for candidate in candidates:
            candidate['my_company_responses'] = responses_map.get(candidate['user_id'], [])
        return candidates
    except Exception as e:
        logger.error(f"Candidate search error for company {company_user_id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during candidate search.")

@router.post("/vacancy_touch/{touch_id}/generate_summary", dependencies=[Depends(get_current_user)])
async def generate_ai_summary(touch_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase or not openai_client:
        raise HTTPException(status_code=500, detail="Services not configured")

    company_user_id = current_user.get("sub")

    try:
        # 1. Получаем отклик и связанные с ним данные, проверяя права доступа
        touch_req = supabase.table("vacancy_touch") \
            .select("*, vacancies(*), resumes(*)") \
            .eq("id", touch_id) \
            .single() \
            .execute()

        if not touch_req.data:
            raise HTTPException(status_code=404, detail="Vacancy touch not found")

        touch_data = touch_req.data
        vacancy_data = touch_data.get("vacancies")
        resume_data = touch_data.get("resumes")

        if not vacancy_data or not resume_data:
            raise HTTPException(status_code=400, detail="Missing vacancy or resume data for analysis.")

        if vacancy_data.get("company_id") != company_user_id:
            raise HTTPException(status_code=403, detail="Access denied: you do not own this vacancy")

        # 2. Формируем промпт для AI
        prompt = f"""
        Проанализируй отклик студента на вакансию.

        **Информация о вакансии:**
        - Название: {vacancy_data.get('title', 'N/A')}
        - Описание: {vacancy_data.get('description', 'N/A')}
        - Требования: {vacancy_data.get('requirements', 'N/A')}

        **Информация о кандидате из резюме:**
        - Заголовок резюме: {resume_data.get('title', 'N/A')}
        - Образование: {resume_data.get('education', 'N/A')}
        - Опыт работы: {resume_data.get('experience', 'N/A')}
        - Навыки: {', '.join(resume_data.get('skills', []))}
        - Языки: {', '.join(resume_data.get('languages', []))}
        - Достижения: {resume_data.get('achievements', 'N/A')}

        **Сопроводительная информация от студента:**
        {touch_data.get('additional_info', 'Кандидат не предоставил дополнительной информации.')}

        **Твоя задача:**
        Верни JSON объект со следующими полями:
        1. "ai_summary": Краткое (3-4 предложения) и нейтральное резюме по кандидату. Опиши, насколько его опыт и навыки соответствуют требованиям вакансии.
        2. "meets_criteria_rating": Оценка от 1 до 100, насколько кандидат соответствует **техническим требованиям** вакансии. Оценивай строго по совпадению навыков и опыта.
        3. "motivation_rating": Оценка от 1 до 100, насколько кандидат кажется мотивированным, основываясь на его сопроводительной информации и достижениях.

        Пример JSON ответа:
        {{
          "ai_summary": "Студент с опытом в Python и SQL, что частично соответствует требованиям. Проекты в портфолио релевантны, но не хватает опыта работы с FastAPI. Мотивационное письмо демонстрирует явный интерес к задачам компании.",
          "meets_criteria_rating": 75,
          "motivation_rating": 85
        }}
        """

        # 3. Отправляем запрос в OpenAI
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Ты — опытный HR-аналитик, который помогает компаниям оценивать кандидатов. Твой ответ всегда должен быть в формате JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )

        response_content = completion.choices[0].message.content
        
        # 4. Парсим ответ и обновляем БД
        try:
            ai_data = json.loads(response_content)
            update_payload = {
                "ai_summary": ai_data.get("ai_summary"),
                "meets_criteria_rating": ai_data.get("meets_criteria_rating"),
                "motivation_rating": ai_data.get("motivation_rating"),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Обновляем запись в vacancy_touch
            updated_touch_req = supabase.table("vacancy_touch") \
                .update(update_payload) \
                .eq("id", touch_id) \
                .execute()
            
            if not updated_touch_req.data:
                 raise HTTPException(status_code=500, detail="Failed to save AI analysis.")

            return updated_touch_req.data[0]

        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse AI response: {e}\nResponse: {response_content}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate AI summary error for touch {touch_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Профили студентов ---
@router.post("/students/profile")
async def create_student_profile(profile: StudentProfile, current_user: dict = Depends(get_current_user)):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("sub") != profile.user_id: raise HTTPException(status_code=403, detail="Not authorized")
    try:
        data = profile.dict(); data["created_at"] = datetime.utcnow().isoformat()
        result = supabase.table("student_profiles").insert(data).execute()
        return result.data[0] if result.data else {}
    except Exception as e: logger.error(f"Create student profile error: {e}"); raise HTTPException(status_code=400, detail=str(e))


@router.get("/students/profile/{user_id}")
async def get_student_profile(user_id: str):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        result = supabase.table("student_profiles").select("*, users(full_name, email)").eq("user_id", user_id).execute()
        if not result.data: raise HTTPException(status_code=404, detail="Profile not found")
        return result.data[0]
    except Exception as e: logger.error(f"Get student profile error: {e}"); raise HTTPException(status_code=400, detail=str(e))


@router.put("/students/profile/{user_id}")
async def update_student_profile(user_id: str, profile: StudentProfile, current_user: dict = Depends(get_current_user)):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("sub") != user_id: raise HTTPException(status_code=403, detail="Not authorized")
    try:
        data = profile.dict(); data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("student_profiles").update(data).eq("user_id", user_id).execute()
        return result.data[0] if result.data else {}
    except Exception as e: logger.error(f"Update student profile error: {e}"); raise HTTPException(status_code=400, detail=str(e))

# --- Резюме ---
@router.post("/resumes")
async def create_resume(resume: Resume, current_user: dict = Depends(get_current_user)):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("sub") != resume.student_id: raise HTTPException(status_code=403, detail="Not authorized")
    try:
        data = resume.dict(); data["created_at"] = datetime.utcnow().isoformat()
        result = supabase.table("resumes").insert(data).execute()
        return result.data[0] if result.data else {}
    except Exception as e: logger.error(f"Create resume error: {e}"); raise HTTPException(status_code=400, detail=str(e))


@router.put("/resumes/{resume_id}")
async def update_resume(resume_id: str, resume_data: ResumeUpdate, current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    if current_user.get('user_type') != 'student':
        raise HTTPException(status_code=403, detail="Access denied: for students only")

    try:
        # 1. Проверяем, что резюме существует и принадлежит текущему пользователю
        existing_resume_req = supabase.table("resumes").select("student_id").eq("id", resume_id).single().execute()

        if not existing_resume_req.data:
            raise HTTPException(status_code=404, detail="Resume not found")

        if existing_resume_req.data.get('student_id') != current_user.get('sub'):
            raise HTTPException(status_code=403, detail="Not authorized to update this resume")

        # 2. Готовим данные для обновления из новой модели
        # exclude_unset=True означает, что в словарь попадут только те поля,
        # которые реально прислал frontend, а не все поля модели со значением None.
        update_data = resume_data.dict(exclude_unset=True)

        # Если frontend прислал пустой объект, нечего обновлять
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update provided")

        update_data['updated_at'] = datetime.utcnow().isoformat()

        # 3. Выполняем обновление
        result = supabase.table("resumes").update(update_data).eq("id", resume_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Update failed, resume not found after update")

        return result.data[0]
    except HTTPException:
        # Просто перебрасываем HTTP исключения, чтобы FastAPI их обработал
        raise
    except Exception as e:
        logger.error(f"Update resume error for resume_id {resume_id}: {e}")
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")


@router.get("/resumes/student/{student_id}")
async def get_student_resumes(student_id: str):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        return supabase.table("resumes").select("*").eq("student_id", student_id).execute().data
    except Exception as e: logger.error(f"Get resumes error: {e}"); raise HTTPException(status_code=400, detail=str(e))

# --- Эндпоинты для Компаний ---
@router.post("/companies/profile")
async def create_company_profile(profile: CompanyProfile, current_user: dict = Depends(get_current_user)):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("sub") != profile.user_id: raise HTTPException(status_code=403, detail="Not authorized")
    try:
        data = profile.dict(); data["created_at"] = datetime.utcnow().isoformat()
        result = supabase.table("company_profiles").insert(data).execute()
        return result.data[0] if result.data else {}
    except Exception as e: logger.error(f"Create company profile error: {e}"); raise HTTPException(status_code=400, detail=str(e))


@router.get("/companies/profile/{user_id}")
async def get_company_profile(user_id: str):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        result = supabase.table("company_profiles").select("*").eq("user_id", user_id).execute()
        if not result.data: raise HTTPException(status_code=404, detail="Profile not found")
        return result.data[0]
    except Exception as e: logger.error(f"Get company profile error: {e}"); raise HTTPException(status_code=400, detail=str(e))


@router.get("/companies/my-vacancies", dependencies=[Depends(get_current_user)])
async def get_my_company_vacancies(current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("user_type") != 'company':
        raise HTTPException(status_code=403, detail="Access denied: for company accounts only")

    company_user_id = current_user.get("sub")

    try:
        # ИЗМЕНЕНИЕ №1:
        # Обращаемся к правильной таблице 'vacancy_touch' для подсчета откликов
        vacancies_data = supabase.table("vacancies") \
            .select("*, vacancy_touch(count)") \
            .eq("company_id", company_user_id) \
            .order("created_at", desc=True) \
            .execute().data

        # Обрабатываем результат для удобства фронтенда
        for vacancy in vacancies_data:
            response_count = 0

            # ИЗМЕНЕНИЕ №2:
            # Проверяем ключ 'vacancy_touch' в ответе от Supabase
            if 'vacancy_touch' in vacancy and vacancy['vacancy_touch']:
                response_count = vacancy['vacancy_touch'][0]['count']

            vacancy['response_count'] = response_count

            # ИЗМЕНЕНИЕ №3:
            # Удаляем старую вложенную структуру 'vacancy_touch'
            del vacancy['vacancy_touch']

        return vacancies_data

    except Exception as e:
        logger.error(f"Get my vacancies error for user {company_user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Вакансии ---
@router.post("/vacancies")
async def create_vacancy(vacancy: Vacancy, current_user: dict = Depends(get_current_user)):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("sub") != vacancy.company_id: raise HTTPException(status_code=403, detail="Not authorized")
    try:
        data = vacancy.dict()
        data["created_at"] = datetime.utcnow().isoformat()
        data["status"] = "pending"
        result = supabase.table("vacancies").insert(data).execute()
        if not result.data: raise HTTPException(status_code=500, detail="Failed to create vacancy")
        created_vacancy = result.data[0]
        feedback_message = {"type": "popup", "title": "Вакансия отправлена на модерацию!", "text": f"Спасибо! Ваша вакансия «{created_vacancy.get('title')}» успешно создана и будет опубликована после проверки модератором."}
        return {"data": created_vacancy, "feedback_message": feedback_message}
    except Exception as e: logger.error(f"Create vacancy error: {e}"); raise HTTPException(status_code=400, detail=str(e))

@router.get("/vacancies")
async def get_vacancies(employment_type: Optional[str] = None, is_internship: Optional[bool] = None, limit: int = 50):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        query = supabase.table("vacancies").select("*, company_profiles(company_name)").eq("status", "active")
        if employment_type: query = query.eq("employment_type", employment_type)
        if is_internship is not None: query = query.eq("is_internship", is_internship)
        return query.limit(limit).execute().data
    except Exception as e: logger.error(f"Get vacancies error: {e}"); raise HTTPException(status_code=400, detail=str(e))

@router.get("/vacancies/{vacancy_id}")
async def get_vacancy(vacancy_id: str):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        result = supabase.table("vacancies").select("*, company_profiles(company_name, description)").eq("id", vacancy_id).execute()
        if not result.data: raise HTTPException(status_code=404, detail="Vacancy not found")
        return result.data[0]
    except Exception as e: logger.error(f"Get vacancy error: {e}"); raise HTTPException(status_code=400, detail=str(e))

# --- Профили вузов ---
@router.post("/universities/profile")
async def create_university_profile(profile: UniversityProfile, current_user: dict = Depends(get_current_user)):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("sub") != profile.user_id: raise HTTPException(status_code=403, detail="Not authorized")
    try:
        data = profile.dict(); data["created_at"] = datetime.utcnow().isoformat()
        result = supabase.table("university_profiles").insert(data).execute()
        return result.data[0] if result.data else {}
    except Exception as e: logger.error(f"Create university profile error: {e}"); raise HTTPException(status_code=400, detail=str(e))

@router.get("/universities/profile/{user_id}")
async def get_university_profile(user_id: str):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        result = supabase.table("university_profiles").select("*").eq("user_id", user_id).execute()
        if not result.data: raise HTTPException(status_code=404, detail="Profile not found")
        return result.data[0]
    except Exception as e: logger.error(f"Get university profile error: {e}"); raise HTTPException(status_code=400, detail=str(e))

# --- Консультации и Чат ---
@router.post("/appointments")
async def create_appointment(appointment: Appointment, current_user: dict = Depends(get_current_user)):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("sub") != appointment.student_id: raise HTTPException(status_code=403, detail="Not authorized")
    try:
        data = appointment.dict(); data["created_at"] = datetime.utcnow().isoformat(); data["status"] = "scheduled"
        result = supabase.table("appointments").insert(data).execute()
        return result.data[0] if result.data else {}
    except Exception as e: logger.error(f"Create appointment error: {e}"); raise HTTPException(status_code=400, detail=str(e))

@router.get("/appointments/student/{student_id}")
async def get_student_appointments(student_id: str):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        return supabase.table("appointments").select("*").eq("student_id", student_id).execute().data
    except Exception as e: logger.error(f"Get appointments error: {e}"); raise HTTPException(status_code=400, detail=str(e))

@router.post("/chat/messages")
async def send_message(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("sub") != message.sender_id: raise HTTPException(status_code=403, detail="Not authorized")
    try:
        data = message.dict(); data["created_at"] = datetime.utcnow().isoformat()
        result = supabase.table("chat_messages").insert(data).execute()
        return result.data[0] if result.data else {}
    except Exception as e: logger.error(f"Send message error: {e}"); raise HTTPException(status_code=400, detail=str(e))

@router.get("/chat/messages/{user_id}")
async def get_messages(user_id: str, limit: int = 100):
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        return supabase.table("chat_messages").select("*").or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}").order("created_at", desc=True).limit(limit).execute().data
    except Exception as e: logger.error(f"Get messages error: {e}"); raise HTTPException(status_code=400, detail=str(e))

# --- AI Чат-бот и Аналитика ---
@router.post("/ai/chat")
async def ai_chat(query: AIQuery):
    # ... (код эндпоинта)
    if not openai_client: return {"response":"AI чат временно недоступен.","action":None}
    try:
        response=openai_client.chat.completions.create(model="gpt-3.5-turbo",messages=[{"role":"system","content":"..."},{"role":"user","content":query.query}],temperature=0.7,max_tokens=200);return {"response":response.choices[0].message.content or "","action":None}
    except Exception as e: logger.error(f"AI chat error: {e}"); return {"response": "Извините, произошла ошибка.", "action": None}


@router.get("/analytics/overview")
async def get_analytics_overview():
    # ... (код эндпоинта)
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    try:
        students=supabase.table("student_profiles").select("id",count="exact").execute();companies=supabase.table("company_profiles").select("id",count="exact").execute();vacancies=supabase.table("vacancies").select("id",count="exact").eq("status","active").execute();internships=supabase.table("vacancies").select("id",count="exact").eq("is_internship",True).eq("status","active").execute()
        return {"total_students":students.count or 0,"total_companies":companies.count or 0,"active_vacancies":vacancies.count or 0,"active_internships":internships.count or 0}
    except Exception as e: logger.error(f"Analytics error: {e}"); raise HTTPException(status_code=500, detail=str(e))

# --- API для Модератора ---
@router.get("/moderator/users", dependencies=[Depends(get_current_moderator)])
async def get_all_users():
    # ... (код эндпоинта)
    try: return supabase.table("users").select("id, full_name, email, user_type, created_at").execute().data
    except Exception as e: raise HTTPException(status_code=500,detail=str(e))

@router.get("/moderator/vacancies", dependencies=[Depends(get_current_moderator)])
async def get_all_vacancies_for_moderator(status: Optional[str] = None):
    # ... (код эндпоинта)
    try:
        query = supabase.table("vacancies").select("*, company_profiles(company_name)")
        if status: query = query.eq("status", status)
        return query.order("created_at", desc=True).execute().data
    except Exception as e: raise HTTPException(status_code=500,detail=str(e))

@router.post("/moderator/vacancies/{vacancy_id}/approve", dependencies=[Depends(get_current_moderator)])
async def approve_vacancy(vacancy_id: str):
    # ... (код эндпоинта)
    try:
        response=supabase.table("vacancies").update({"status":"active"}).eq("id",vacancy_id).execute()
        if not response.data: raise HTTPException(status_code=404,detail="Vacancy not found"); return response.data[0]
    except Exception as e: logger.error(f"Approve vacancy error: {e}"); raise HTTPException(status_code=500, detail=str(e))

@router.post("/moderator/vacancies/{vacancy_id}/reject", dependencies=[Depends(get_current_moderator)])
async def reject_vacancy(vacancy_id: str):
    # ... (код эндпоинта)
    try:
        response = supabase.table("vacancies").update({"status": "rejected"}).eq("id", vacancy_id).execute()
        if not response.data: raise HTTPException(status_code=404, detail="Vacancy not found")
        return response.data[0]
    except Exception as e: logger.error(f"Reject vacancy error: {e}"); raise HTTPException(status_code=500, detail=str(e))

@router.delete("/moderator/vacancies/{vacancy_id}", dependencies=[Depends(get_current_moderator)])
async def delete_vacancy(vacancy_id: str):
    # ... (код эндпоинта)
    try:
        response=supabase.table("vacancies").delete().eq("id",vacancy_id).execute()
        if not response.data: raise HTTPException(status_code=404,detail="Vacancy not found or already deleted"); return {"message":"Vacancy deleted successfully"}
    except Exception as e: logger.error(f"Delete vacancy error: {e}"); raise HTTPException(status_code=500, detail=str(e))

@router.get("/moderator/universities", dependencies=[Depends(get_current_moderator)])
async def get_all_universities():
    # ... (код эндпоинта)
    try: return supabase.table("university_profiles").select("*").execute().data
    except Exception as e: raise HTTPException(status_code=500,detail=str(e))

@router.get("/moderator/analytics/detailed", dependencies=[Depends(get_current_moderator)])
async def get_detailed_analytics():
    # ... (код эндпоинта)
    try:
        users_req=supabase.table("users").select("user_type",count="exact").execute();vacancies_req=supabase.table("vacancies").select("status",count="exact").execute()
        user_counts={"student":0,"company":0,"university":0,"moderator":0};[user_counts.update({u['user_type']:user_counts.get(u['user_type'],0)+1}) for u in users_req.data]
        vacancy_counts={"active":0,"pending":0,"archived":0,"rejected":0,"other":0};[vacancy_counts.update({v.get('status','other'):vacancy_counts.get(v.get('status','other'),0)+1}) for v in vacancies_req.data]
        return {"users_by_type":user_counts,"vacancies_by_status":vacancy_counts,"total_users":users_req.count,"total_vacancies":vacancies_req.count}
    except Exception as e:logger.error(f"Detailed analytics error: {e}");raise HTTPException(status_code=500,detail=str(e))


# --- Отклики на вакансии ---
@router.post("/vacancy_touches")  # <-- URL изменен для консистентности
async def create_vacancy_touch(response: VacancyTouchCreate, current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    if current_user.get("user_type") != 'student':
        raise HTTPException(status_code=403, detail="Access denied: for students only")

    # Проверяем, что ID студента в токене совпадает с ID в запросе
    if current_user.get("sub") != response.student_id:
        raise HTTPException(status_code=403, detail="Not authorized to create a response for another user")

    try:
        # Готовим данные для вставки, используя модель без ID
        data = response.dict()

        # Добавляем серверные поля
        data["created_at"] = datetime.utcnow().isoformat()
        data["status"] = "pending"  # Статус по умолчанию

        # Вставляем данные в ПРАВИЛЬНУЮ таблицу
        result = supabase.table("vacancy_touch").insert(data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create vacancy response")

        feedback_message = {
            "type": "popup",
            "title": "Отклик отправлен!",
            "text": "Ваш отклик на вакансию успешно отправлен. Ждите ответа от работодателя."
        }
        return {"data": result.data[0], "feedback_message": feedback_message}

    except Exception as e:
        logger.error(f"Create vacancy response error: {e}")
        # Возвращаем более информативную ошибку, если она от Supabase
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/vacancy_responses/company")
async def get_company_responses(current_user: dict = Depends(get_current_user)):
    if not supabase: raise HTTPException(status_code=500, detail="Database not configured")
    if current_user.get("user_type") != 'company': raise HTTPException(status_code=403, detail="Access denied: for company accounts only")
    company_user_id = current_user.get("sub")
    try:
        # Получаем вакансии компании
        vacancies_req = supabase.table("vacancies").select("id").eq("company_id", company_user_id).execute()
        vacancy_ids = [v['id'] for v in vacancies_req.data]
        if not vacancy_ids: return []

        # Получаем отклики с join на студентов, резюме и вакансии
        responses = supabase.table("vacancy_responses").select(
            "*, student_profiles(*, users(full_name, email)), resumes(title, content), vacancies(title)"
        ).in_("vacancy_id", vacancy_ids).execute().data
        return responses
    except Exception as e:
        logger.error(f"Get company responses error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/vacancies/{vacancy_id}/responses", dependencies=[Depends(get_current_user)])
async def get_vacancy_with_responses(vacancy_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    company_user_id = current_user.get("sub")

    try:
        # Проверка владельца вакансии
        vacancy_check_q = supabase.table("vacancies").select("company_id").eq("id", vacancy_id).single().execute()
        vacancy_check = vacancy_check_q.data
        if not vacancy_check:
            raise HTTPException(status_code=404, detail="Vacancy not found")
        if vacancy_check.get("company_id") != company_user_id:
            raise HTTPException(status_code=403, detail="Access denied: you do not own this vacancy")

        # Основной запрос — выбираем все поля вакансии + связанные отклики и вложенные объекты
        query = supabase.table("vacancies") \
            .select("*, vacancy_touch(*, users:student_id(*, student_profiles(*)), resumes:resume_id(*))") \
            .eq("id", vacancy_id) \
            .single() \
            .execute()

        data = query.data if query.data else None

        if data and 'vacancy_touch' in data and isinstance(data['vacancy_touch'], list):
            for touch in data['vacancy_touch']:
                # --- НОРМАЛИЗАЦИЯ ИМЕН ПОЛЕЙ ---
                # ai_summary (варианты названий)
                if 'ai_summary' not in touch and 'ai_summery' in touch:
                    touch['ai_summary'] = touch.get('ai_summery')

                # motivation_rating (возможные варианты)
                if 'motivation_rating' not in touch:
                    # некоторые старые имена/варианты
                    if 'motivation_score' in touch:
                        touch['motivation_rating'] = touch.get('motivation_score')
                    elif 'motivation' in touch:
                        touch['motivation_rating'] = touch.get('motivation')

                # meets_criteria_rating (исправляем возможные опечатки)
                if 'meets_criteria_rating' not in touch:
                    if 'meets_creteria_rating' in touch:  # опечатка в названии столбца
                        touch['meets_criteria_rating'] = touch.get('meets_creteria_rating')
                    elif 'meets_criteria' in touch:
                        touch['meets_criteria_rating'] = touch.get('meets_criteria')

                # Приведём рейтинги к числам, если они приходят как строки
                for fld in ('motivation_rating', 'meets_criteria_rating'):
                    if fld in touch and touch[fld] is not None:
                        try:
                            # если это число в строке — привести
                            touch[fld] = int(touch[fld])
                        except Exception:
                            # если не приводится — оставим как есть (без падения)
                            pass

                # --- ВСПОМОГАТЕЛЬНЫЕ ПРЕОБРАЗОВАНИЯ РЕЗЮМЕ/ПРОФИЛЯ ---
                # Если в touch есть 'users' (из nested select), перемещаем student_profiles как в старом коде
                final_profile_with_user = None
                if touch.get('users'):
                    user_data = touch.get('users')
                    profile_list = user_data.pop('student_profiles', [])
                    if profile_list:
                        final_profile = profile_list[0]
                        final_profile['users'] = user_data
                        final_profile_with_user = final_profile
                touch['student_profiles'] = final_profile_with_user
                if 'users' in touch:
                    del touch['users']

                # Убедимся, что resumes лежит как объект (если nested selection вернула массив/объект)
                # (в твоём коде ты ожидаешь r.resumes быть объектом — оставим как есть)
                # Если возникнут другие старые названия колонок — можно дополнить нормализацию здесь.

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get vacancy with responses error for vacancy {vacancy_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# графики и аналитика

class Granularity(str, Enum):
    day = "day"
    week = "week"
    month = "month"


@router.get("/vacancies/stats/by-time")
async def get_vacancy_stats_by_time(
        granularity: Granularity = Granularity.day,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=30)

    try:
        response = supabase.rpc('get_vacancy_creation_stats', {
            'start_date': str(start_date),
            'end_date': str(end_date),
            'granularity': granularity.value
        }).execute()

        if response.data is None:
            logger.warning("RPC call to get_vacancy_creation_stats returned no data.")
            return []

        return response.data

    except Exception as e:
        logger.error(f"Get vacancy stats error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/stats/by-time")
async def get_student_stats_by_time(
        granularity: Granularity = Granularity.day,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    # Устанавливаем значения по умолчанию для дат
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=30)

    try:
        # Вызываем нашу НОВУЮ SQL-функцию через RPC
        response = supabase.rpc('get_student_registration_stats', {
            'start_date': str(start_date),
            'end_date': str(end_date),
            'granularity': granularity.value
        }).execute()

        if response.data is None:
            logger.warning("RPC call to get_student_registration_stats returned no data.")
            return []

        return response.data

    except Exception as e:
        logger.error(f"Get student stats error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/analytics/company-activity")
async def get_company_activity_stats(limit: int = 10):
    """
    Возвращает статистику по количеству вакансий и откликов
    в разрезе компаний для построения гистограммы.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        # Вызываем нашу новую SQL-функцию
        response = supabase.rpc(
            'get_vacancy_touch_stats_by_company',  # <-- Новое имя
            {'company_limit': limit}
        ).execute()

        if response.data is None:
            logger.warning("RPC call to get_vacancy_response_stats_by_company returned no data.")
            return []

        return response.data

    except Exception as e:
        logger.error(f"Get company activity stats error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/analytics/word-cloud")
async def get_word_cloud_data(limit: int = 50):
    """
    Возвращает самые популярные навыки из резюме студентов
    для построения облака слов.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        # Вызываем нашу новую, эффективную SQL-функцию
        response = supabase.rpc(
            'get_resume_skill_stats',
            {'skill_limit': limit}
        ).execute()

        if response.data is None:
            logger.warning("RPC call to get_resume_skill_stats returned no data.")
            return []

        return response.data

    except Exception as e:
        logger.error(f"Get word cloud data from resumes error: {e}")
        raise HTTPException(status_code=400, detail=str(e))