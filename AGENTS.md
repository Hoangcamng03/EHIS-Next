# EHIS Next

- This is a new implementation. Never copy the old project's credentials, ownership identifiers, patient data, or permissive security rules.
- Read README.md and docs/ARCHITECTURE.md before changing behavior.
- Keep mobile, web, and Functions changes in their own modules. API and schema changes require updating docs/API_CONTRACT.md.
- Never commit credentials, tokens, keystores, .env files, or actual health records.
- Use synthetic data and project demo-ehis-next for local integration.
- Clients cannot grant roles or verification, assign incidents, or read another patient's profile.
- Cloud Functions use Admin SDK: validate authorization in every handler; Firestore Rules do not protect Admin SDK operations.
- Check affected code before requesting review. Do not claim APK, device, push, NFC, or cloud Functions deployment without evidence.
- Do not enable billing or deploy to any earlier Firebase project as part of routine local work.
