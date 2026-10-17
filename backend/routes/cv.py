"""CV maker and CV upload.

GET    /api/cv/me          -> {"cv": {...sections...}, "file": {meta} | null}
PUT    /api/cv/me          -> save the CV maker sections
POST   /api/cv/me/file     -> upload a PDF or Word CV (multipart field "file", max 2 MB)
GET    /api/cv/me/file     -> download your uploaded CV
DELETE /api/cv/me/file     -> remove it
"""
import io
from datetime import datetime

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models import Resume, ResumeFile

cv_bp = Blueprint("cv", __name__)

MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_ITEMS = 20

# Field limits for the CV maker. Anything not listed here is dropped.
TEXT_FIELDS = {"full_name": 100, "headline": 150, "email": 200, "phone": 50,
               "location": 120, "summary": 2000, "visa": 60}
LIST_SCHEMAS = {
    "education": {"school": 150, "degree": 120, "field": 120, "start": 20, "end": 20, "details": 1000},
    "experience": {"title": 150, "company": 150, "location": 120, "start": 20, "end": 20, "details": 1500},
    "languages": {"name": 60, "level": 60},
    "certifications": {"name": 150, "year": 20},
    "links": {"label": 60, "url": 300},
}


def _clean_text(value, limit):
    return str(value or "").strip()[:limit]


def _clean_cv(raw: dict) -> dict:
    raw = raw if isinstance(raw, dict) else {}
    out = {k: _clean_text(raw.get(k), lim) for k, lim in TEXT_FIELDS.items()}
    for key, fields in LIST_SCHEMAS.items():
        items = raw.get(key) if isinstance(raw.get(key), list) else []
        cleaned = []
        for item in items[:MAX_ITEMS]:
            if not isinstance(item, dict):
                continue
            row = {f: _clean_text(item.get(f), lim) for f, lim in fields.items()}
            if any(row.values()):
                if key == "links" and row["url"] and not row["url"].lower().startswith(("http://", "https://")):
                    row["url"] = "https://" + row["url"]
                cleaned.append(row)
        out[key] = cleaned
    skills = raw.get("skills") if isinstance(raw.get("skills"), list) else []
    out["skills"] = [s for s in (_clean_text(x, 60) for x in skills[:40]) if s]
    return out


def _detect_type(filename: str, head: bytes):
    """Trust the file's content, not just its name."""
    name = (filename or "").lower()
    if head.startswith(b"%PDF-"):
        return "application/pdf"
    if head.startswith(b"PK\x03\x04") and name.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return None


@cv_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_cv():
    uid = int(get_jwt_identity())
    cv = Resume.query.filter_by(user_id=uid).first()
    f = ResumeFile.query.filter_by(user_id=uid).first()
    return jsonify({
        "cv": cv.data if cv else None,
        "updated_at": cv.to_dict()["updated_at"] if cv else None,
        "file": f.meta() if f else None,
    }), 200


@cv_bp.route("/me", methods=["PUT"])
@jwt_required()
def save_my_cv():
    uid = int(get_jwt_identity())
    data = _clean_cv(request.get_json(silent=True) or {})
    cv = Resume.query.filter_by(user_id=uid).first()
    if cv is None:
        cv = Resume(user_id=uid)
        db.session.add(cv)
    cv.data = data
    cv.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"cv": cv.data, "updated_at": cv.to_dict()["updated_at"]}), 200


@cv_bp.route("/me/file", methods=["POST"])
@jwt_required()
def upload_cv_file():
    uid = int(get_jwt_identity())
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify({"error": "Choose a PDF or Word (.docx) file to upload."}), 400
    content = upload.read(MAX_FILE_BYTES + 1)
    if len(content) > MAX_FILE_BYTES:
        return jsonify({"error": "That file is over 2 MB. Please upload a smaller PDF or .docx."}), 400
    if not content:
        return jsonify({"error": "That file is empty."}), 400
    mime = _detect_type(upload.filename, content[:8])
    if mime is None:
        return jsonify({"error": "Only PDF or Word (.docx) files can be uploaded."}), 400

    safe_name = "".join(c for c in upload.filename if c.isalnum() or c in " ._-()")[:150] or "cv"
    f = ResumeFile.query.filter_by(user_id=uid).first()
    if f is None:
        f = ResumeFile(user_id=uid, filename=safe_name, mime=mime, size=len(content), content=content)
        db.session.add(f)
    else:
        f.filename, f.mime, f.size, f.content = safe_name, mime, len(content), content
        f.uploaded_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"file": f.meta()}), 201


@cv_bp.route("/me/file", methods=["GET"])
@jwt_required()
def download_cv_file():
    uid = int(get_jwt_identity())
    f = ResumeFile.query.filter_by(user_id=uid).first()
    if f is None:
        return jsonify({"error": "You haven't uploaded a CV yet."}), 404
    return send_file(io.BytesIO(f.content), mimetype=f.mime, as_attachment=True, download_name=f.filename)


@cv_bp.route("/me/file", methods=["DELETE"])
@jwt_required()
def delete_cv_file():
    uid = int(get_jwt_identity())
    f = ResumeFile.query.filter_by(user_id=uid).first()
    if f is None:
        return jsonify({"error": "You haven't uploaded a CV yet."}), 404
    db.session.delete(f)
    db.session.commit()
    return jsonify({"message": "CV file removed."}), 200
