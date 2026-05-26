import os
from uuid import uuid4

import pdfplumber

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")


def extract_text(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def save_upload(file_bytes: bytes, filename: str) -> tuple[str, str]:
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    file_id = str(uuid4())
    ext = filename.rsplit(".", 1)[-1]
    file_path = os.path.join(UPLOADS_DIR, f"{file_id}.{ext}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return file_id, file_path
