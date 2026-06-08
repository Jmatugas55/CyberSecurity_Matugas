SPECIALIZATION_KEYWORDS = {
    "Cardiology": ("chest pain", "palpitation", "heart", "blood pressure"),
    "Dermatology": ("rash", "skin", "acne", "itch", "lesion"),
    "Endocrinology": ("diabetes", "thyroid", "hormone", "blood sugar"),
    "Gastroenterology": ("stomach", "abdominal", "diarrhea", "constipation", "vomit"),
    "Neurology": ("headache", "migraine", "seizure", "numbness", "dizziness"),
    "Obstetrics and Gynecology": ("pregnancy", "menstrual", "pelvic", "vaginal"),
    "Ophthalmology": ("eye", "vision", "sight"),
    "Orthopedic Surgery": ("bone", "joint", "fracture", "knee", "back pain"),
    "Otolaryngology / ENT": ("ear", "nose", "throat", "sinus"),
    "Pediatrics": ("child", "infant", "baby"),
    "Psychiatry": ("anxiety", "depression", "panic", "mental health"),
    "Pulmonology": ("breathing", "shortness of breath", "asthma", "lung", "cough"),
    "Urology": ("urine", "urinary", "kidney stone", "bladder"),
}


def suggest_specialization(chief_complaint: str, symptoms: str) -> str:
    text = f"{chief_complaint} {symptoms}".casefold()
    best_name = "General Medicine"
    best_score = 0
    for name, keywords in SPECIALIZATION_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text)
        if score > best_score:
            best_name = name
            best_score = score
    return best_name
