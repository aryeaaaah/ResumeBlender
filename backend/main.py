import os
import json
import subprocess
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

load_dotenv()

from resume_parser import (extract_text_from_pdf,extract_text_from_docx)
from claude_selenium import (
    open_and_login, confirm_login,
    run_score, run_tailor, run_cover_letter,
    close_driver
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR  = Path(__file__).parent.parent
OUTPUTS   = BASE_DIR / "outputs"
GENERATOR = BASE_DIR / "generator"
UPLOADS   = BASE_DIR / "uploads"

OUTPUTS.mkdir(exist_ok=True)
UPLOADS.mkdir(exist_ok=True)

app.mount("/outputs", StaticFiles(directory=str(OUTPUTS)), name="outputs")

# ── In-memory session ─────────────────────────────────────────────────────────
session = {}


# ── /open-browser ─────────────────────────────────────────────────────────────
@app.post("/open-browser")
def open_browser():
    """
    Opens Edge to claude.ai.
    Frontend shows 'Please log in then click confirm'.
    """
    try:
        open_and_login()
        return {"status": "opened"}
    except Exception as e:
        return {"error": str(e)}


# ── /confirm-login ────────────────────────────────────────────────────────────
@app.post("/confirm-login")
def confirm_login_endpoint():
    """
    Called when user clicks 'I have logged in' in the UI.
    Checks the browser is on the right page.
    """
    ok = confirm_login()
    if ok:
        return {"status": "logged_in"}
    return {"error": "Login not detected — make sure you are on the Claude chat page."}


# ── /analyse ──────────────────────────────────────────────────────────────────
@app.post("/analyse")
async def analyse(
    job_description: str  = Form(...),
    resume_file:     UploadFile = File(...),
   # guidelines_file: UploadFile = File(...),
):
    # Save uploaded files
    resume_path     = UPLOADS / "resume.pdf"
  #  guidelines_path = UPLOADS / "guidelines.md"

    with open(resume_path, "wb") as f:
        f.write(await resume_file.read())
  #  with open(guidelines_path, "wb") as f:
     #   f.write(await guidelines_file.read())

    # Extract text
    resume_text = extract_text_from_pdf(str(resume_path))
  #  guidelines  = guidelines_path.read_text(encoding="utf-8")

    # Store in session
    session["job_description"] = job_description
    session["resume_text"]     = resume_text
   # session["guidelines"]      = guidelines
    session["tailored_data"]   = None

    # Score original resume via selenium
    try:
        original_score = run_score(resume_text, job_description, True)
    except Exception as e:
        return {"error": f"Scoring failed: {str(e)}"}

    session["original_score"] = original_score
    return {"original_score": original_score}


# ── /tailor ───────────────────────────────────────────────────────────────────
@app.post("/tailor")
def tailor():
    if not session.get("resume_text"):
        return {"error": "Run /analyse first"}

    try:
        tailored_data = run_tailor(
            session["resume_text"],
            session["job_description"],
          #  session["guidelines"] # Not used in current prompt, but left here for easy future updates
        )
    except Exception as e:
        return {"error": f"Tailoring failed: {str(e)}"}

    session["tailored_data"] = tailored_data

    # Write JSON for Node.js generator
    data_path = GENERATOR / "resume_data.json"
    data_path.write_text(json.dumps(tailored_data, indent=2), encoding="utf-8")

    # Run Node.js resume generator
    out_filename = "tailored_resume.docx"
    out_path     = OUTPUTS / out_filename
    result = subprocess.run(
        ["node", "generate_resume.js", str(out_path)],
        cwd=str(GENERATOR),
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return {"error": "Resume generator failed", "detail": result.stderr}

    # Score tailored resume
    try:
        # tailored_text  = _resume_json_to_text(tailored_data) # OLD CODE
        tailored_text = extract_text_from_docx(str(out_path)) # NEW CODE (UNTESTED)
        tailored_score = run_score(tailored_text, session["job_description"], False)
    except Exception as e:
        return {"error": f"Tailored scoring failed: {str(e)}"}

    session["tailored_score"] = tailored_score

    return {
        "tailored_score": tailored_score,
        "original_score": session["original_score"],
        "filename":       out_filename,
        "download_url":   f"/outputs/{out_filename}"
    }


# ── /cover-letter ─────────────────────────────────────────────────────────────
@app.post("/cover-letter")
def cover_letter():
    if not session.get("tailored_data"):
        return {"error": "Run /tailor first"}

    try:
        cl_data = run_cover_letter(
            session["job_description"],
            session["tailored_data"]
        )
    except Exception as e:
        return {"error": f"Cover letter failed: {str(e)}"}

    # Write JSON for Node.js generator
    cl_path = GENERATOR / "cover_letter_data.json"
    cl_path.write_text(json.dumps(cl_data, indent=2), encoding="utf-8")

    # Run Node.js cover letter generator
    out_filename = "cover_letter.docx"
    out_path     = OUTPUTS / out_filename
    result = subprocess.run(
        ["node", "generate_cover.js", str(out_path)],
        cwd=str(GENERATOR),
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return {"error": "Cover letter generator failed", "detail": result.stderr}

    return {
        "filename":     out_filename,
        "download_url": f"/outputs/{out_filename}"
    }


# ── /download/<filename> ──────────────────────────────────────────────────────
@app.get("/download/{filename}")
def download(filename: str):
    path = OUTPUTS / filename
    if not path.exists():
        return {"error": "File not found"}
    return FileResponse(
        path=str(path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename
    )


# ── /shutdown ─────────────────────────────────────────────────────────────────
@app.post("/shutdown")
def shutdown():
    close_driver()
    return {"status": "browser closed"}


# ── Helper ────────────────────────────────────────────────────────────────────
def _resume_json_to_text(data: dict) -> str:
    parts = [data.get("name", ""), data.get("tagline", ""), data.get("profile", "")]
    for k, v in data.get("skills", {}).items():
        parts.append(f"{k}: {v}")
    for exp in data.get("experience", []):
        parts.append(f"{exp['role']} at {exp['company']}")
        parts.extend(exp.get("bullets", []))
    for proj in data.get("projects", []):
        parts.append(proj["name"])
        parts.extend(proj.get("bullets", []))
    for edu in data.get("education", []):
        parts.append(f"{edu['degree']} - {edu['school']}")
    return "\n".join(parts)