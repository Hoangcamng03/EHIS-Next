# EHIS Next

- This is a new implementation. Never copy the old project's credentials, ownership identifiers, patient data, or permissive security rules.
- Read README.md and docs/ARCHITECTURE.md before changing behavior.
- Keep mobile, web, and Functions changes in their own modules. API and schema changes require updating docs/API_CONTRACT.md.
- Never commit credentials, tokens, keystores, .env files, or actual health records.
- Use synthetic data and project demo-ehis-next for local integration.
- Clients cannot grant roles or verification, assign incidents, or read another patient's profile.
- Cloud Functions use Admin SDK: validate authorization in every handler; Firestore Rules do not protect Admin SDK operations.
- Check affected code before requesting review. Do not claim APK, device, push, NFC, or cloud Functions deployment without evidence.
- Every change session must update docs/LAB_NOTES.md, including code, UI, config, deployment, accounts, documentation and failed/incomplete work. Group small edits by task; record reason, scope, checks/results and remaining work. Never log secrets or actual patient data.
- Follow docs/BUG_FIX_WORKFLOW.md for bug fixes: reproduce, assess impact, fix the cause, verify regression and affected flow, request peer review, release and verify separately. After three failed repair attempts on the same issue, record hypotheses/evidence and reassess; do not loop blindly, weaken tests or claim success without evidence. External blockers remain open with the next action identified.
- Do not enable billing or deploy to any earlier Firebase project as part of routine local work.
- User release preference: after mobile-facing changes, release the app web and Android preview together with `npm run release:preview -- --message "..."`; add `--native` when the runtime fingerprint changes or a new APK is required. Do not hand off a web-only app update as a synchronized release.
- EAS Update targets preview only and must use the preview cloud environment. Never force-reload an active incident to apply an update. Publishing is not proof that a phone installed/applied it; record APK/OTA/web results separately in the release log and lab notes.
