# Kairacure Admin Portal (`kairacure-admin`)

Secure Administrative Portal for Kairacure Medical Travel Platform (`https://admin.kairacure.com`).

## Key Features & Security
- **Subdomain Protection**: Dedicated build bundle hosted on `admin.kairacure.com`.
- **Role-Based Access Control (RBAC)**: SuperAdmin, MedicalDirector, HospitalAdmin, CaseCoordinator, Auditor.
- **Two-Factor Authentication (2FA)**: Mandatory TOTP challenge verification for administrative logins.
- **Patient Record Management**: Encrypted PHI viewing, doctor/hospital mapping, and treatment cost management.
- **Audit Logs Interface**: Real-time compliance activity tracker.

## Quick Start
```bash
# Install dependencies
npm install

# Run development server (Port 5174)
npm run dev

# Build for production
npm run build
```
