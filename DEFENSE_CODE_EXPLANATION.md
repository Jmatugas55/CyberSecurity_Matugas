# DEFENSE CODE EXPLANATION

## 1. Project Overview

This project is a hospital cybersecurity and health management system named in the frontend as CyberHealth and in the backend as Hospital Auth & Booking System. It combines account registration, login security, role-based dashboards, appointment management, password recovery, login attempt monitoring, account blocking, notifications, and face recognition for account recovery.

The main purpose is to let hospital users access healthcare services securely. Patients can register, log in, view doctors, book appointments, review appointment status, and receive notifications. Doctors can log in, view patient records listed in the system, manage appointment requests, add diagnoses, and monitor login attempts.

The roles actually found in the code are:

- Doctor
- Patient

The homepage text mentions cybersecurity staff, but the actual backend and frontend role definitions only implement `doctor` and `patient`. Cybersecurity-style functionality is still present through login attempt monitoring, blocked-user viewing, account unblocking, and reset controls, mainly exposed inside the doctor dashboard.

The system is important because hospital systems handle sensitive health and identity information. It supports hospital cybersecurity by hashing passwords, enforcing password rules, validating input, tracking failed login attempts, locking accounts after repeated failures, separating doctor and patient access, and supporting controlled password recovery methods.

## 2. Technology Stack

### React
Where used: `frontend/src/*.tsx`, especially `App.tsx`, pages, and components.
Purpose: Builds the user interface.
Importance: Provides the interactive login, registration, dashboard, appointment, notification, and face capture screens.

### TypeScript
Where used: `frontend/src/types.ts`, all `.tsx` files, and TypeScript config files.
Purpose: Adds typed frontend data structures.
Importance: Reduces mistakes when passing login data, role data, appointments, notifications, and API responses.

### Vite
Where used: `frontend/vite.config.ts`, `frontend/package.json`.
Purpose: Frontend development and build tool.
Importance: Runs the React application efficiently during development.

### Tailwind CSS
Where used: `frontend/src/index.css`, `frontend/tailwindcss.config.js`, component class names.
Purpose: Utility-first styling.
Importance: Creates responsive dashboards, forms, modals, and dark/light UI styling.

### React Router
Where used: `frontend/src/App.tsx`, login/register/forgot navigation.
Purpose: Handles frontend routes.
Importance: Separates homepage, login, registration, forgot password, doctor dashboard, and patient dashboard.

### Axios
Where used: `frontend/src/api/api.ts`.
Purpose: Sends HTTP requests to the backend API.
Importance: Connects frontend actions to backend authentication, appointments, notifications, and security features.

### FastAPI
Where used: `backend/app/main.py` and backend routers.
Purpose: Backend API framework.
Importance: Provides API endpoints for registration, login, password reset, face verification, appointments, users, and login monitoring.

### Python
Where used: Entire `backend/app/` directory.
Purpose: Backend language.
Importance: Implements business logic, security rules, database access, and face recognition processing.

### SQLAlchemy
Where used: `backend/app/database.py`, `backend/app/models.py`, routers.
Purpose: ORM and database session management.
Importance: Defines and queries users, login attempts, password resets, doctors, patients, appointments, notifications, and face enrollments.

### MySQL / MariaDB-Compatible Database
Where used: `DATABASE_URL` in `backend/app/database.py`, `authdb.sql`, `PyMySQL` dependency.
Purpose: Persistent data storage.
Importance: Stores accounts, hashed passwords, recovery data, login attempts, appointments, and medical workflow records.

### bcrypt
Where used: `backend/app/security.py`.
Purpose: Password hashing and password verification.
Importance: Protects user passwords by storing hashes instead of plaintext passwords.

### Pydantic
Where used: `backend/app/schemas.py`.
Purpose: Request and response validation.
Importance: Validates emails, roles, reset methods, password reset payloads, face payloads, and appointment input.

### OpenCV
Where used: `backend/app/face_utils.py`.
Purpose: Face image decoding, detection, cropping, normalization, and ORB feature extraction.
Importance: Supports face-based password recovery verification.

### NumPy
Where used: `backend/app/face_utils.py`.
Purpose: Converts image bytes into arrays for OpenCV.
Importance: Enables image processing for face recognition.

### scikit-image
Where used: `backend/app/face_utils.py`.
Purpose: Structural similarity comparison through `ssim`.
Importance: Adds another similarity score for face matching.

### python-dotenv
Where used: `backend/app/database.py`.
Purpose: Loads environment variables.
Importance: Keeps database connection configuration out of source code.

## 3. Project Folder Structure

```text
ProjectRoot/
|-- frontend/
|   |-- src/
|   |   |-- api/api.ts
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   |-- session.ts
|   |   |-- theme.tsx
|   |   |-- types.ts
|   |   |-- pages/
|   |   |   |-- Homepage.tsx
|   |   |   |-- Login.tsx
|   |   |   |-- Register.tsx
|   |   |   |-- ForgotPassword.tsx
|   |   |   |-- DoctorDashboard.tsx
|   |   |   |-- PatientDashboard.tsx
|   |   |   |-- Dashboard.tsx
|   |   |-- components/
|   |       |-- AuthForm.tsx
|   |       |-- ResetMethodForm.tsx
|   |       |-- FaceCapture.tsx
|   |       |-- LoginAttempts.tsx
|   |       |-- DashboardShell.tsx
|   |       |-- ChangeEmail.tsx
|   |       |-- ResetPasswordPanel.tsx
|   |       |-- NotificationsDrawer.tsx
|   |       |-- Modal.tsx
|   |-- package.json
|   |-- vite.config.ts
|-- backend/
|   |-- requirements.txt
|   |-- app/
|       |-- main.py
|       |-- database.py
|       |-- models.py
|       |-- schemas.py
|       |-- security.py
|       |-- utils.py
|       |-- crud.py
|       |-- face_utils.py
|       |-- routers/
|           |-- auth.py
|           |-- password.py
|           |-- face.py
|           |-- login_attempts.py
|           |-- doctors.py
|           |-- appointments.py
|           |-- email.py
|-- authdb.sql
|-- DEFENSE_CODE_EXPLANATION.md
```

`frontend/` contains the React application. It is responsible for displaying the UI, managing browser sessions, protecting frontend routes, collecting user input, opening the camera, and calling backend APIs.

`backend/` contains the FastAPI application. It is responsible for validating requests, managing database records, enforcing security rules, processing login attempts, handling password reset workflows, and processing face verification.

`authdb.sql` is a database dump containing schema for users, login attempts, and password resets. It also contains inserted sample data and should not be used to expose real credentials.

## 4. Main System Flow

1. The user opens the frontend homepage at `/`.
2. The user chooses login or registration.
3. During registration, the user selects either `patient` or `doctor`, enters profile information, sets a password, and chooses a recovery method.
4. The frontend validates required fields and password rules before sending data to the backend.
5. The backend validates the request through Pydantic schemas and `validate_password`.
6. The backend checks if the email already exists.
7. The backend hashes the password using bcrypt and creates a user record.
8. If the user is a doctor, a doctor profile is created. If the user is a patient, a patient profile is created.
9. During login, the frontend submits email and password to `/login`.
10. The backend checks whether the user exists and whether the account is currently locked.
11. The backend verifies the password with bcrypt.
12. Failed logins are recorded in `login_attempts`. After five failed attempts, `blocked_until` is set for 15 minutes.
13. Successful login clears failed attempts, records a successful attempt, returns the user role and profile, and the frontend stores session data in localStorage.
14. The frontend redirects doctors to `/doctor` and patients to `/patient`.
15. Protected frontend routes check the stored role before rendering dashboards.
16. Dashboard pages load data from the backend, such as doctors, patients, appointments, notifications, login attempts, and blocked users.

## 5. Authentication Explanation

### File: backend/app/routers/auth.py
Purpose: Handles registration, login, security question lookup, and reset method lookup.
Important functions/classes: `register`, `login`, `get_security_question`, `get_reset_method`, `MAX_ATTEMPTS`, `BLOCK_MINUTES`.
How it works: Registration validates password policy, checks duplicate email, creates the user, then creates either a doctor or patient profile. Login verifies credentials, logs failures and successes, locks accounts after repeated failures, and returns role/profile data.
Defense explanation: This is the main authentication controller. It prevents duplicate accounts, enforces password strength, verifies hashed passwords, tracks login behavior, and identifies the correct dashboard through the stored role.

### File: backend/app/security.py
Purpose: Provides password hashing and verification.
Important functions/classes: `hash_password`, `verify_password`.
How it works: Passwords are encoded as UTF-8, trimmed to bcrypt's 72-byte limit, hashed with `bcrypt.hashpw`, and verified using `bcrypt.checkpw`.
Defense explanation: The system does not store plaintext passwords. It stores bcrypt hashes, so even if the database is exposed, the original password is not directly visible.

### File: backend/app/crud.py
Purpose: Contains reusable database operations.
Important functions/classes: `create_user`, `get_user_by_email`, `update_user_password`, `update_user_email`, `create_doctor_profile`, `create_patient_profile`.
How it works: It hashes passwords before saving users, validates allowed roles and recovery methods, hashes security answers, updates password/email records, and creates role-specific profiles.
Defense explanation: This file centralizes important database write logic so user creation and updates are consistent.

### File: backend/app/schemas.py
Purpose: Defines and validates request/response payloads.
Important functions/classes: `UserCreate`, `UserLogin`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `FaceEnrollRequest`, `FaceVerifyRequest`.
How it works: Pydantic validates email format, role values, required doctor/patient profile fields, recovery method rules, reset key format, and face image requirements.
Defense explanation: This protects the backend from incomplete or invalid input before business logic runs.

### File: frontend/src/session.ts
Purpose: Stores and clears the browser session.
Important functions/classes: `saveSession`, `getSession`, `clearSession`, `getRole`.
How it works: Login response data is stored in localStorage under `appSession`, plus helper keys for email and role. Logout removes the stored session.
Defense explanation: This frontend session controls which dashboard the user sees. It is useful for navigation but should not be treated as a full backend authorization system.

### File: frontend/src/App.tsx
Purpose: Defines routes and frontend route protection.
Important functions/classes: `RequireRole`, `RoleRedirect`.
How it works: `RequireRole` checks the stored role. If no role exists, it redirects to `/`. If the role is wrong, it redirects to the correct dashboard.
Defense explanation: This prevents casual frontend access to the wrong dashboard and improves user flow after login.

## 6. Security Features Explanation

### Password Hashing
File/s: `backend/app/security.py`, `backend/app/crud.py`
Purpose: Protect stored passwords and security answers.
How it works: `hash_password` uses bcrypt salts and hashes. `create_user` hashes passwords and also hashes security answers when the chosen recovery method is security question.
Why it is important: It prevents storing sensitive secrets in plaintext.
Defense explanation: Passwords are one-way hashed. During login, the entered password is checked against the stored hash, not compared as plaintext.

### Password Policy Validation
File/s: `backend/app/utils.py`, `frontend/src/components/AuthForm.tsx`, `frontend/src/pages/ForgotPassword.tsx`
Purpose: Enforce stronger passwords.
How it works: Passwords must be at least 8 characters and include uppercase, lowercase, number, and special character.
Why it is important: Stronger passwords reduce the risk of guessing and brute-force compromise.
Defense explanation: The rule exists both in frontend for immediate feedback and backend for actual enforcement.

### Login Attempt Tracking
File/s: `backend/app/routers/auth.py`, `backend/app/models.py`, `backend/app/routers/login_attempts.py`, `frontend/src/components/LoginAttempts.tsx`
Purpose: Record successful and failed logins.
How it works: Failed login attempts are inserted into `login_attempts`. Successful logins also create success records. The monitoring route aggregates attempts by email.
Why it is important: It gives visibility into suspicious login behavior.
Defense explanation: This feature supports cybersecurity monitoring by showing repeated failures, successful logins, and currently blocked accounts.

### Account Lockout
File/s: `backend/app/routers/auth.py`, `backend/app/models.py`, `backend/app/routers/login_attempts.py`
Purpose: Temporarily block repeated failed login attempts.
How it works: After 5 failed attempts, `blocked_until` is set to 15 minutes in the user record. Login checks this field before password verification.
Why it is important: It slows brute-force attacks.
Defense explanation: If an attacker repeatedly guesses a password, the account is locked temporarily to protect the user.

### Role-Based Access Control
File/s: `backend/app/models.py`, `backend/app/schemas.py`, `backend/app/routers/auth.py`, `frontend/src/App.tsx`, `frontend/src/pages/DoctorDashboard.tsx`, `frontend/src/pages/PatientDashboard.tsx`
Purpose: Separate doctor and patient functionality.
How it works: The `users.role` field stores `doctor` or `patient`. Login returns the role. Frontend routes and dashboards check it.
Why it is important: Doctors and patients should not have the same workflow or visible data.
Defense explanation: The role determines which dashboard is shown and which operations are allowed in parts of the backend, such as appointment booking for patients.

### Protected Routes
File/s: `frontend/src/App.tsx`
Purpose: Prevent unauthorized dashboard viewing in the frontend.
How it works: `RequireRole` redirects users if their saved role does not match the route.
Why it is important: It prevents accidental access to the wrong dashboard.
Defense explanation: This is frontend route protection. For production, backend authorization should also be strengthened on every sensitive API route.

### CORS Configuration
File/s: `backend/app/main.py`
Purpose: Allow frontend and backend to communicate during development.
How it works: FastAPI allows origins `http://localhost:5173` and `http://127.0.0.1:5173`.
Why it is important: It restricts browser access to known frontend origins during local development.
Defense explanation: CORS prevents arbitrary browser origins from using the API unless allowed.

### Input Validation
File/s: `backend/app/schemas.py`, `backend/app/utils.py`, frontend forms.
Purpose: Reject invalid or incomplete requests.
How it works: Pydantic checks email formats and required fields. Custom validators check roles, reset methods, reset key pattern, security question data, and face image requirements.
Why it is important: It reduces invalid data and common user-input errors.
Defense explanation: Validation is applied before saving or processing data, which improves system reliability and security.

### Email Change Verification
File/s: `backend/app/routers/email.py`, `frontend/src/components/ChangeEmail.tsx`
Purpose: Require password confirmation before changing email.
How it works: The frontend first calls `/change-email/verify`, then submits the new email to `/change-email`. The backend verifies the password before updating.
Why it is important: Prevents email takeover if a user walks away from an open session.
Defense explanation: The system requires the current password before sensitive account changes.

### Password Recovery Token
File/s: `backend/app/routers/password.py`, `backend/app/models.py`, `backend/app/crud.py`
Purpose: Allow verified users to reset passwords.
How it works: After successful recovery verification, the backend creates a random token with a 15-minute expiration. `/reset-password` requires the matching token and email.
Why it is important: It limits password reset access to a short-lived token.
Defense explanation: Password recovery is not immediate. The user must prove identity through the chosen recovery method, then use a temporary token.

### Face-Based Recovery
File/s: `backend/app/routers/face.py`, `backend/app/face_utils.py`, `frontend/src/components/FaceCapture.tsx`, `frontend/src/pages/ForgotPassword.tsx`
Purpose: Verify identity through a captured face image for password recovery.
How it works: The camera captures a base64 image. Backend detects and normalizes the face, stores an enrollment image, then compares new captures during recovery.
Why it is important: Adds a biometric-style recovery option.
Defense explanation: This is used for account recovery, not normal login. It compares the captured face to the enrolled face before issuing a reset token.

## 7. Face Recognition Explanation

Face recognition implementation was found in the current project files.

Main files:

- `frontend/src/components/FaceCapture.tsx`
- `frontend/src/components/ResetMethodForm.tsx`
- `frontend/src/pages/ForgotPassword.tsx`
- `backend/app/routers/face.py`
- `backend/app/routers/password.py`
- `backend/app/face_utils.py`
- `backend/app/models.py`

What it is used for: Face recognition is used for password recovery. During registration, a user can choose face recovery and enroll a face image. During forgot password, the user can scan their face to verify identity and receive a reset token.

Step-by-step process:

1. The frontend opens the camera using `navigator.mediaDevices.getUserMedia`.
2. The video frame is drawn to a temporary canvas.
3. The canvas is converted into a PNG base64 data URL.
4. During enrollment, the frontend sends the image to `/face/enroll`.
5. The backend decodes the image, detects the largest face using OpenCV Haar cascade, crops it, resizes it to 200x200, converts it to grayscale, equalizes the histogram, and stores it as PNG bytes.
6. During verification, the frontend sends a fresh camera frame to `/face/verify` or `/forgot-password`.
7. The backend processes the fresh image the same way.
8. The backend compares the stored face and new face using SSIM and ORB feature matching.
9. A match requires both the SSIM score and the ORB match count to pass thresholds.
10. If matched, verification succeeds and password reset can continue.
11. If no face is detected or the face does not match, the backend returns an error.

Limitations:

- Accuracy depends on lighting, camera quality, pose, and face visibility.
- This implementation uses Haar cascade, SSIM, and ORB matching, not a production-grade deep face embedding model.
- Face recovery should be supported by additional security controls before production use.
- The system should use HTTPS in production because camera images are sensitive.

## 8. Database Explanation

### Table/Model Name: User
Purpose: Stores account credentials and recovery settings.
Important fields: `id`, `email`, `password`, `role`, `reset_method`, `reset_key`, `security_question`, `security_answer`, `blocked_until`, `created_at`.
How it is used: Login, registration, password reset, email change, role-based routing, and account lockout depend on this table.
Defense explanation: This is the central account table. It stores hashed passwords and role values used to identify whether the user is a doctor or patient.

### Table/Model Name: LoginAttempt
Purpose: Stores login success/failure records.
Important fields: `id`, `user_id`, `email`, `ip_address`, `success`, `attempt_time`.
How it is used: Failed attempts are counted for lockout. Attempts are aggregated for monitoring.
Defense explanation: This table supports cybersecurity monitoring by showing which accounts have suspicious login behavior.

### Table/Model Name: PasswordReset
Purpose: Stores temporary password reset tokens.
Important fields: `id`, `user_id`, `token`, `expires_at`.
How it is used: Password reset requires a valid token connected to the user.
Defense explanation: It ensures only verified reset requests can update a password, and tokens expire after 15 minutes.

### Table/Model Name: Doctor
Purpose: Stores doctor-specific profile data.
Important fields: `id`, `user_id`, `name`, `specialization`, `created_at`.
How it is used: Doctor dashboard, doctor listings, and appointments.
Defense explanation: The doctor profile separates professional details from the base account.

### Table/Model Name: Patient
Purpose: Stores patient-specific profile data.
Important fields: `id`, `user_id`, `name`, `contact_number`, `created_at`.
How it is used: Patient dashboard, patient listings, and appointments.
Defense explanation: The patient profile connects the user account to healthcare booking data.

### Table/Model Name: Appointment
Purpose: Stores doctor-patient appointments.
Important fields: `id`, `doctor_id`, `patient_id`, `appointment_date`, `appointment_time`, `diagnosis`, `status`, `created_at`.
How it is used: Patients book appointments. Doctors accept, reject, complete, or add diagnosis notes.
Defense explanation: This is the main health management workflow table.

### Table/Model Name: Notification
Purpose: Stores user notifications.
Important fields: `id`, `user_id`, `title`, `message`, `is_read`, `created_at`.
How it is used: Appointment creation and updates notify the correct user.
Defense explanation: Notifications keep doctors and patients informed about important workflow changes.

### Table/Model Name: FaceEnrollment
Purpose: Stores enrolled face image bytes.
Important fields: `id`, `user_id`, `face_image`, `created_at`.
How it is used: Face verification compares fresh captures against this stored face image.
Defense explanation: This supports biometric-style identity verification for password recovery.

## 9. Frontend Explanation

### File: frontend/src/App.tsx
Purpose: Main routing file.
Important logic: Defines routes for homepage, login, register, forgot password, doctor dashboard, patient dashboard, and role redirect.
What the user sees: The correct page based on the route.
How it connects to backend/session: Uses `getRole()` from `session.ts` to protect role routes.
Defense explanation: This file controls frontend navigation and prevents users from viewing the wrong dashboard.

### File: frontend/src/api/api.ts
Purpose: API client.
Important logic: Uses Axios with backend base URL `http://127.0.0.1:8000` and exposes functions for all backend endpoints.
What the user sees: No direct UI; pages use it to load and submit data.
How it connects to backend/session: Sends login, registration, password reset, face, appointment, notification, and security monitoring requests.
Defense explanation: This is the bridge between the frontend and backend.

### File: frontend/src/session.ts
Purpose: Browser session helper.
Important logic: Saves, retrieves, and clears the logged-in user session.
What the user sees: Persistent dashboard access after login until logout.
How it connects to backend/session: Stores backend login response data.
Defense explanation: It helps route users based on role, but production backend API authorization should not rely only on localStorage.

### File: frontend/src/pages/Homepage.tsx
Purpose: Landing page.
Important logic: Presents CyberHealth features, team, services, and links to sign in/register.
What the user sees: Marketing-style overview of the hospital cybersecurity system.
How it connects to backend/session: It mainly links to authentication pages.
Defense explanation: This introduces the system purpose and directs users to login or registration.

### File: frontend/src/pages/Login.tsx
Purpose: Login screen.
Important logic: Submits email/password, saves returned session, redirects by role.
What the user sees: Email/password form, forgot password link, success/error modal.
How it connects to backend/session: Calls `/login`, then stores `user_id`, `email`, `role`, and `profile`.
Defense explanation: This is where authentication begins from the user's perspective.

### File: frontend/src/pages/Register.tsx
Purpose: Registration screen.
Important logic: Two-step registration with profile fields first and recovery method second.
What the user sees: Role selector, profile fields, password fields, and recovery method choices.
How it connects to backend/session: Calls `/register`; if face recovery is selected, calls `/face/enroll`.
Defense explanation: Registration collects both account data and recovery setup before account use.

### File: frontend/src/components/AuthForm.tsx
Purpose: Collects registration basics.
Important logic: Validates full name, role-specific fields, password policy, password match, password strength, and 72-byte limit.
What the user sees: Role selection, name, specialization/contact, email, password, and confirm password fields.
How it connects to backend/session: Sends validated data upward to `Register.tsx`.
Defense explanation: It improves user input quality before backend validation.

### File: frontend/src/components/ResetMethodForm.tsx
Purpose: Lets a registering user choose account recovery method.
Important logic: Supports reset key, security question, and face recovery.
What the user sees: Recovery method cards and related input fields.
How it connects to backend/session: Sends chosen recovery data to registration flow.
Defense explanation: It gives users multiple recovery methods while validating the required data for each method.

### File: frontend/src/pages/ForgotPassword.tsx
Purpose: Password recovery screen.
Important logic: Detects the account's reset method, verifies key/question/face, receives token, then submits new password.
What the user sees: Email field, verification method, token stage, and new password fields.
How it connects to backend/session: Calls `/reset-method`, `/security-question`, `/forgot-password`, and `/reset-password`.
Defense explanation: It ensures password reset requires the recovery method registered by the user.

### File: frontend/src/components/FaceCapture.tsx
Purpose: Camera capture and face scanning UI.
Important logic: Opens webcam, captures frames as PNG data URLs, optionally auto-scans against `/face/verify`.
What the user sees: Camera preview, capture button, scanner overlay, and match/error messages.
How it connects to backend/session: Sends frames to face verification API when scan mode is used.
Defense explanation: This component provides the frontend biometric capture needed for face recovery.

### File: frontend/src/pages/DoctorDashboard.tsx
Purpose: Doctor dashboard.
Important logic: Shows appointments, patients, login attempts, reset password panel, change email modal, and notifications.
What the user sees: Doctor workflow tools and security monitoring panel.
How it connects to backend/session: Loads data using stored session email and role.
Defense explanation: Doctors can manage health workflows and view login security monitoring.

### File: frontend/src/pages/PatientDashboard.tsx
Purpose: Patient dashboard.
Important logic: Shows doctors, appointment booking, appointment status, reset password panel, change email modal, and notifications.
What the user sees: Doctor list, booking modal, personal appointments, notifications.
How it connects to backend/session: Uses session email to create and fetch patient appointments.
Defense explanation: Patients can request care while staying inside their own dashboard workflow.

### File: frontend/src/components/LoginAttempts.tsx
Purpose: Security monitoring UI.
Important logic: Loads all, success-only, failed-only, and blocked-user views; can unblock and reset attempt records.
What the user sees: Table of login attempt summaries and blocked users.
How it connects to backend/session: Calls `/login-attempts`, `/blocked-users`, `/unblock-user`, and reset endpoints.
Defense explanation: This is the visible cybersecurity monitoring feature.

### File: frontend/src/components/DashboardShell.tsx
Purpose: Shared dashboard layout.
Important logic: Sidebar navigation, logout, notifications button, theme toggle.
What the user sees: Dashboard frame used by doctor and patient pages.
How it connects to backend/session: Logout clears local session.
Defense explanation: This keeps dashboard behavior consistent across roles.

## 10. Backend Explanation

### File: backend/app/main.py
Purpose: Backend entry point.
Important functions/classes: `FastAPI`, CORS middleware, `include_router`.
How it works: Creates database tables, configures CORS, registers all routers, and exposes `/`.
Defense explanation: This starts the backend and connects all API modules.

### File: backend/app/database.py
Purpose: Database setup.
Important functions/classes: `DATABASE_URL`, `engine`, `SessionLocal`, `Base`.
How it works: Loads `DATABASE_URL` from environment variables and creates SQLAlchemy session tools.
Defense explanation: This controls the database connection. Secret connection values should remain in environment variables.

### File: backend/app/models.py
Purpose: Database model definitions.
Important functions/classes: `User`, `LoginAttempt`, `PasswordReset`, `Doctor`, `Patient`, `Appointment`, `Notification`, `FaceEnrollment`.
How it works: Maps Python classes to database tables.
Defense explanation: This defines the system's persistent data structure.

### File: backend/app/schemas.py
Purpose: API validation schemas.
Important functions/classes: `UserCreate`, `ForgotPasswordRequest`, `AppointmentCreate`, etc.
How it works: Validates request shape and required values before routers process them.
Defense explanation: This file protects the backend from invalid input.

### File: backend/app/routers/auth.py
Purpose: Authentication routes.
Important functions/classes: `register`, `login`.
How it works: Handles account creation, login, attempt tracking, account lockout, and role response.
Defense explanation: This is the core login security module.

### File: backend/app/routers/password.py
Purpose: Password recovery.
Important functions/classes: `forgot_password`, `reset_password`.
How it works: Verifies reset key, security question, or face image; generates a temporary token; validates token before updating password.
Defense explanation: This provides controlled account recovery.

### File: backend/app/routers/face.py
Purpose: Face enrollment and verification routes.
Important functions/classes: `enroll_face`, `verify_face_route`.
How it works: Stores processed face image bytes and verifies fresh captures.
Defense explanation: This enables face recognition recovery.

### File: backend/app/routers/login_attempts.py
Purpose: Security monitoring API.
Important functions/classes: `get_login_attempts`, `get_blocked_users`, `unblock_user`, reset endpoints.
How it works: Aggregates login attempts, returns blocked users, clears failed/success attempts, and unblocks accounts.
Defense explanation: This supports security review and account recovery from lockouts.

### File: backend/app/routers/doctors.py
Purpose: Doctor and patient listing plus current user profile.
Important functions/classes: `list_doctors`, `list_patients`, `get_me`.
How it works: Joins profile tables with users to return useful profile data.
Defense explanation: This supplies dashboard data.

### File: backend/app/routers/appointments.py
Purpose: Appointment and notification workflow.
Important functions/classes: `create_appointment`, `list_appointments`, `update_appointment`, `delete_appointment`, notification routes.
How it works: Patients book appointments, doctors update status and diagnosis, notifications are created for affected users.
Defense explanation: This is the main health management module.

### File: backend/app/routers/email.py
Purpose: Email change API.
Important functions/classes: `verify_change_email`, `change_email`.
How it works: Verifies current password before updating email.
Defense explanation: This protects a sensitive account change.

## 11. Role-Based Access Control

Roles found in the actual code:

- `doctor`
- `patient`

The role is stored in the `users.role` column and represented in the frontend as `Role = "doctor" | "patient"` in `frontend/src/types.ts`.

Role checks happen in several places:

- Registration accepts only `doctor` or `patient`.
- Registration creates either a doctor profile or patient profile.
- Login returns the role and matching profile.
- `frontend/src/App.tsx` redirects users based on stored role.
- `DoctorDashboard.tsx` redirects non-doctors away.
- `PatientDashboard.tsx` redirects non-patients away.
- Appointment booking checks that the requesting user is a patient.
- Appointment listing filters records based on doctor or patient profile.

Dashboard mapping:

- Doctor -> `/doctor`
- Patient -> `/patient`

If an unauthorized user tries to open the wrong dashboard, the frontend redirects them to the correct dashboard or homepage.

Defense explanation: The role controls the user's workflow. Doctors manage patients and appointments, while patients book appointments and view their own records. The current frontend route protection is useful, but production should enforce authorization more strictly on every backend route.

## 12. Important Code Snippets

### Password Hashing
File: `backend/app/security.py`
Code:
```python
hashed = bcrypt.hashpw(raw, bcrypt.gensalt())
return hashed.decode("utf-8")
```
Explanation: The password is salted and hashed before storage.
Why it matters: Plain passwords are not saved in the database.

### Password Verification
File: `backend/app/security.py`
Code:
```python
return bcrypt.checkpw(raw, hashed_password.encode("utf-8"))
```
Explanation: Login compares the entered password with the stored bcrypt hash.
Why it matters: The system can verify identity without revealing the original password.

### Account Lockout
File: `backend/app/routers/auth.py`
Code:
```python
MAX_ATTEMPTS = 5
BLOCK_MINUTES = 15
```
Explanation: The system allows five failed attempts before a temporary lock.
Why it matters: It reduces brute-force login risk.

### Failed Login Recording
File: `backend/app/routers/auth.py`
Code:
```python
attempt = LoginAttempt(
    user_id=db_user.id,
    email=db_user.email,
    ip_address=ip,
    success=False,
)
```
Explanation: Each failed login is stored with user, email, IP, and result.
Why it matters: It gives the system data for lockout and monitoring.

### CORS Setup
File: `backend/app/main.py`
Code:
```python
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
```
Explanation: Only local frontend origins are allowed during development.
Why it matters: It controls which browser origins can call the API.

### Protected Route Logic
File: `frontend/src/App.tsx`
Code:
```tsx
if (!r) return <Navigate to="/" replace />
if (r !== role) return <Navigate to={r === "doctor" ? "/doctor" : "/patient"} replace />
```
Explanation: The frontend redirects users with missing or incorrect roles.
Why it matters: It separates doctor and patient dashboard access in the UI.

### Role Redirect After Login
File: `frontend/src/pages/Login.tsx`
Code:
```tsx
navigate(data.role === "doctor" ? "/doctor" : "/patient")
```
Explanation: After successful login, the user is sent to the correct dashboard.
Why it matters: Role-based workflow begins immediately after authentication.

### Database Connection
File: `backend/app/database.py`
Code:
```python
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
```
Explanation: Database connection is loaded from environment variables.
Why it matters: Secrets should not be hardcoded in source files.

### Face Matching Decision
File: `backend/app/face_utils.py`
Code:
```python
is_match = (ssim_score >= SSIM_THRESHOLD) and (good >= ORB_MATCH_THRESHOLD)
```
Explanation: A face match requires both image similarity and enough ORB feature matches.
Why it matters: It avoids relying on only one weak comparison signal.

### Password Reset Token
File: `backend/app/routers/password.py`
Code:
```python
token = secrets.token_urlsafe(32)
expires = datetime.utcnow() + timedelta(minutes=15)
```
Explanation: A secure random token is created with short expiration.
Why it matters: Password reset access is temporary and hard to guess.

## 13. Error Handling and Validation

- Invalid login: `/login` returns `401 Invalid credentials`.
- Wrong password: Failed attempt is recorded, remaining attempts are returned.
- Too many failed attempts: Account is locked for 15 minutes and `403` is returned.
- Existing email: `/register` returns `400 Email already registered`.
- Missing fields: Pydantic validators and frontend forms reject missing role-specific fields.
- Invalid input: Email format, reset key pattern, password rules, and appointment status are validated.
- Unauthorized appointment booking: `/appointments` returns `403` if the requester is not a patient.
- Face recognition failure: Backend returns errors for no face detected, no enrolled face, or face mismatch.
- Expired reset token: `/reset-password` deletes expired token and returns an error.
- Database configuration: `DATABASE_URL` is expected from environment variables; if missing, backend startup will fail.

## 14. System Strengths

- Uses bcrypt password hashing.
- Enforces password complexity rules.
- Validates emails and request payloads with Pydantic.
- Tracks failed and successful login attempts.
- Locks accounts after repeated failed attempts.
- Provides blocked-user monitoring and unblocking endpoints.
- Implements role-based doctor and patient dashboards.
- Supports appointment booking and doctor appointment management.
- Supports notifications for appointment actions.
- Supports reset key, security question, and face-based password recovery.
- Uses environment variable loading for database URL.
- Separates frontend and backend responsibilities clearly.

## 15. System Limitations

- No JWT or server-side login token is implemented; session state is stored in frontend localStorage.
- Some backend routes use email and role query parameters instead of authenticated server-side identity.
- The frontend stores `userPassword` in localStorage for local reset panel behavior, which is not suitable for production.
- Face recognition uses OpenCV Haar cascade, SSIM, and ORB matching, which may be affected by lighting, camera quality, and pose.
- The SQL dump contains sample inserted values; real dumps should not expose tokens, emails, or password hashes publicly.
- HTTPS is required before deploying because login credentials and face images are sensitive.
- The homepage mentions cybersecurity staff, but the actual implemented roles are only doctor and patient.
- The legacy `Dashboard.tsx` exists but the main routing now uses doctor and patient dashboards.

## 16. Suggested Improvements

- Add JWT or secure HTTP-only cookie authentication.
- Enforce backend authorization on every protected API route.
- Remove password storage from localStorage.
- Add email verification during registration.
- Add two-factor authentication for sensitive accounts.
- Add audit logs for account changes, unblocks, and password resets.
- Improve face recognition using a stronger face embedding model.
- Add HTTPS deployment configuration.
- Add unit and integration tests for auth, lockout, reset, appointments, and face verification.
- Add database backup and recovery procedures.
- Move all secrets and environment-specific settings to `.env` or deployment secret storage.
- Add rate limiting by IP and email for login and password recovery endpoints.

## 17. Defense Questions and Answers

Q: Why is this system needed?
A: Hospitals handle sensitive patient and appointment data. This system helps manage healthcare workflows while applying security controls such as password hashing, login monitoring, account lockout, and role-based access.

Q: What roles are implemented?
A: The actual code implements two roles: doctor and patient.

Q: How does registration work?
A: The user selects a role, enters required profile data, sets a strong password, chooses a recovery method, and the backend validates and stores the account with a bcrypt-hashed password.

Q: How are passwords protected?
A: Passwords are hashed with bcrypt before being stored. Login uses bcrypt verification instead of plaintext comparison.

Q: What happens after multiple failed logins?
A: Failed attempts are recorded. After five failed attempts, the account is locked for 15 minutes using the `blocked_until` field.

Q: How does role-based access work?
A: The role is stored in the user record. After login, the frontend saves the role and routes doctors to `/doctor` and patients to `/patient`.

Q: How does face recognition work?
A: The camera captures an image, the backend detects and normalizes the face with OpenCV, then compares it with the enrolled face using SSIM and ORB matching.

Q: Is face recognition used for login?
A: No. In this project, face recognition is used for password recovery verification.

Q: What database tables are important?
A: The key models are users, login attempts, password resets, doctors, patients, appointments, notifications, and face enrollments.

Q: How does the system prevent unauthorized access?
A: It uses password verification, account lockout, role-based frontend routing, and some backend role checks such as allowing only patients to book appointments.

Q: What is the strongest security feature?
A: The strongest implemented features are bcrypt password hashing, password policy enforcement, failed login tracking, and account lockout.

Q: What is the biggest limitation?
A: The biggest limitation is that full server-side session authentication such as JWT or secure cookies is not yet implemented.

Q: What should be improved first?
A: Add secure backend authentication and authorization so every protected API request is verified server-side.

## 18. Short Oral Defense Script

Good day. Our project is a hospital cybersecurity and health management system called CyberHealth. It is designed to help doctors and patients use hospital services securely while supporting important cybersecurity controls.

The system has two implemented roles: doctor and patient. Patients can register, log in, view doctors, book appointments, view appointment status, and receive notifications. Doctors can manage appointment requests, view registered patients, add diagnosis information, and monitor login attempts and blocked users.

For authentication, the backend validates user input, checks duplicate emails, enforces a strong password policy, and hashes passwords using bcrypt before saving them. During login, the backend verifies the entered password against the stored hash. Failed logins are recorded, and after five failed attempts the account is locked for 15 minutes.

For password recovery, the system supports reset key, security question, and face recognition. In face recovery, the frontend captures an image from the camera, and the backend uses OpenCV to detect and normalize the face. It then compares the new image with the enrolled face using SSIM and ORB feature matching.

The database stores users, doctor and patient profiles, login attempts, password reset tokens, appointments, notifications, and face enrollments. Role-based access is handled by storing the role in the user record and using it to redirect users to the correct dashboard.

Overall, the project demonstrates secure authentication, login monitoring, account lockout, role-based dashboards, and healthcare workflow management. For future improvement, the system should add stronger server-side authentication such as JWT or secure cookies, stricter backend authorization, audit logs, and production HTTPS deployment.

## 19. Files Reviewed

- `frontend/package.json`: reviewed frontend dependencies and scripts.
- `frontend/src/App.tsx`: reviewed routing and protected role routes.
- `frontend/src/main.tsx`: reviewed frontend entry point.
- `frontend/src/session.ts`: reviewed browser session storage and logout clearing.
- `frontend/src/theme.tsx`: reviewed dark/light theme provider.
- `frontend/src/types.ts`: reviewed role, session, appointment, notification, and security types.
- `frontend/src/api/api.ts`: reviewed all frontend API calls.
- `frontend/src/pages/Homepage.tsx`: reviewed landing page and system messaging.
- `frontend/src/pages/Login.tsx`: reviewed login submission, session saving, and role redirect.
- `frontend/src/pages/Register.tsx`: reviewed registration flow and face enrollment flow.
- `frontend/src/pages/ForgotPassword.tsx`: reviewed reset method detection and password reset flow.
- `frontend/src/pages/DoctorDashboard.tsx`: reviewed doctor workflow and login attempt monitoring access.
- `frontend/src/pages/PatientDashboard.tsx`: reviewed patient booking and appointment workflow.
- `frontend/src/pages/Dashboard.tsx`: reviewed legacy dashboard behavior.
- `frontend/src/components/AuthForm.tsx`: reviewed registration validation and password strength logic.
- `frontend/src/components/ResetMethodForm.tsx`: reviewed recovery method selection.
- `frontend/src/components/FaceCapture.tsx`: reviewed camera access, frame capture, and face scan mode.
- `frontend/src/components/LoginAttempts.tsx`: reviewed login attempt and blocked-user UI.
- `frontend/src/components/DashboardShell.tsx`: reviewed shared dashboard layout and logout.
- `frontend/src/components/ChangeEmail.tsx`: reviewed password verification before email change.
- `frontend/src/components/ResetPasswordPanel.tsx`: reviewed local password reset panel behavior.
- `frontend/src/components/NotificationsDrawer.tsx`: reviewed notification display and read status updates.
- `backend/requirements.txt`: reviewed backend dependencies.
- `backend/app/main.py`: reviewed FastAPI app setup, CORS, and routers.
- `backend/app/database.py`: reviewed database connection setup.
- `backend/app/models.py`: reviewed SQLAlchemy models and relationships.
- `backend/app/schemas.py`: reviewed request validation schemas.
- `backend/app/security.py`: reviewed bcrypt password hashing and verification.
- `backend/app/utils.py`: reviewed database dependency, password policy, and base64 helpers.
- `backend/app/crud.py`: reviewed user/profile/password/email database operations.
- `backend/app/face_utils.py`: reviewed OpenCV face processing and matching.
- `backend/app/routers/auth.py`: reviewed registration, login, lockout, and reset method routes.
- `backend/app/routers/password.py`: reviewed forgot password and reset password routes.
- `backend/app/routers/face.py`: reviewed face enrollment and verification endpoints.
- `backend/app/routers/login_attempts.py`: reviewed login attempt monitoring and unblocking endpoints.
- `backend/app/routers/doctors.py`: reviewed doctor, patient, and current-user profile endpoints.
- `backend/app/routers/appointments.py`: reviewed appointment and notification workflow.
- `backend/app/routers/email.py`: reviewed email change verification.
- `authdb.sql`: reviewed database schema only; inserted sample secrets/tokens were not included in this document.

## Final Check

- `DEFENSE_CODE_EXPLANATION.md` is intended to be located in the main project root folder.
- It is not inside `frontend/`.
- It is not inside `backend/`.
- It explains security, authentication, role-based access, database, frontend, backend, and face recognition.
- Secret values, inserted reset tokens, database passwords, and private credentials are not exposed.
- This document is suitable for oral defense study.
