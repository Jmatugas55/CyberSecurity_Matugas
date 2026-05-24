"""Face recognition helpers using OpenCV (Haar cascade) + ORB descriptor matching
plus SSIM as a secondary check. Lightweight, no external face-embedding model.
"""
import base64
import io
import re
import numpy as np
import cv2
from skimage.metrics import structural_similarity as ssim


FACE_SIZE = 200  # cropped, normalized face size in pixels
SSIM_THRESHOLD = 0.40  # >=  this is "same"
ORB_MATCH_THRESHOLD = 25  # >=  this many good matches => "same"


def _decode_data_url(data_url: str) -> np.ndarray:
    if not data_url:
        raise ValueError("empty image")
    body = data_url
    if "," in data_url and data_url.startswith("data:"):
        body = data_url.split(",", 1)[1]
    body = re.sub(r"\s+", "", body)
    pad = (-len(body)) % 4
    if pad:
        body += "=" * pad
    raw = base64.b64decode(body)
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("could not decode image")
    return img


def _detect_and_crop(img_bgr: np.ndarray) -> np.ndarray:
    """Detect a single face, return a normalized grayscale crop (FACE_SIZE x FACE_SIZE)."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    cascade = cv2.CascadeClassifier(cascade_path)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(60, 60))
    if len(faces) == 0:
        raise ValueError("no face detected in the image. Please look at the camera.")
    # use the largest face
    x, y, w, h = max(faces, key=lambda r: r[2] * r[3])
    crop = gray[y:y + h, x:x + w]
    crop = cv2.resize(crop, (FACE_SIZE, FACE_SIZE))
    crop = cv2.equalizeHist(crop)
    return crop


def encode_face(data_url: str) -> bytes:
    """Decode a data URL, detect & crop the face, return PNG-encoded bytes for storage."""
    img = _decode_data_url(data_url)
    crop = _detect_and_crop(img)
    ok, buf = cv2.imencode(".png", crop)
    if not ok:
        raise ValueError("could not encode face")
    return buf.tobytes()


def _crop_from_bytes(b: bytes) -> np.ndarray:
    arr = np.frombuffer(b, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("stored face could not be decoded")
    return img


def verify_face(stored_bytes: bytes, candidate_data_url: str) -> tuple[bool, dict]:
    """Compare a stored, cropped face against a freshly-captured image.

    Returns (is_match, info_dict) so we can surface scores during debugging.
    """
    stored = _crop_from_bytes(stored_bytes)
    candidate_img = _decode_data_url(candidate_data_url)
    candidate = _detect_and_crop(candidate_img)

    # SSIM (structural similarity) on equalized faces
    ssim_score = float(ssim(stored, candidate))

    # ORB descriptor matching for robustness against lighting / pose
    orb = cv2.ORB_create(nfeatures=500)
    k1, d1 = orb.detectAndCompute(stored, None)
    k2, d2 = orb.detectAndCompute(candidate, None)
    good = 0
    if d1 is not None and d2 is not None and len(d1) > 0 and len(d2) > 0:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(d1, d2)
        # consider matches with low Hamming distance "good"
        good = sum(1 for m in matches if m.distance <= 50)

    is_match = (ssim_score >= SSIM_THRESHOLD) and (good >= ORB_MATCH_THRESHOLD)
    return is_match, {"ssim": round(ssim_score, 3), "orb_matches": good}
