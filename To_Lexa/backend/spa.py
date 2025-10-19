import os
import mimetypes
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

# --- Настройка MIME-типов для статики ---
mimetypes.init()
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

# --- SPA Routing ---
@router.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    static_file_path = os.path.join("static", full_path)
    if os.path.exists(static_file_path) and os.path.isfile(static_file_path):
        mime_type, _ = mimetypes.guess_type(static_file_path)
        return FileResponse(static_file_path, media_type=mime_type or "application/octet-stream")
    
    index_path = "static/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    else:
        raise HTTPException(status_code=404, detail="Frontend not built yet. Run 'npm run build' in frontend directory.")