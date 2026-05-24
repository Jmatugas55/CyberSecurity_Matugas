from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, crud, models
from ..utils import get_db
from ..face_utils import encode_face, verify_face

router = APIRouter()


@router.post("/face/enroll")
def enroll_face(req: schemas.FaceEnrollRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, req.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        face_bytes = encode_face(req.face_image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    existing = db.query(models.FaceEnrollment).filter(models.FaceEnrollment.user_id == user.id).first()
    if existing:
        existing.face_image = face_bytes
    else:
        enrollment = models.FaceEnrollment(user_id=user.id, face_image=face_bytes)
        db.add(enrollment)

    user.reset_method = "face"
    user.reset_key = None
    user.security_question = None
    user.security_answer = None
    db.commit()

    return {"message": "Face enrolled. You can now use face recognition to reset your password."}


@router.post("/face/verify")
def verify_face_route(req: schemas.FaceVerifyRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, req.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    enrollment = db.query(models.FaceEnrollment).filter(models.FaceEnrollment.user_id == user.id).first()
    if not enrollment:
        raise HTTPException(status_code=400, detail="No face enrolled for this account")

    try:
        ok, info = verify_face(enrollment.face_image, req.face_image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not ok:
        raise HTTPException(status_code=401, detail=f"Face does not match (ssim={info['ssim']}, matches={info['orb_matches']})")

    return {"verified": True, **info}
