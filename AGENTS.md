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
- User release preference updated 2026-10-22: finish and verify the controlled web trial first; wait for the user's review/approval before publishing new Android APK/OTA or iOS releases. This supersedes the earlier simultaneous web/Android instruction for the current web validation phase. Record web and installed native versions separately. Once native release is approved, use `npm run release:preview -- --message "..."` with `--native` when required.
- Keep explanations, team documentation and operations clear for members with mixed programming experience; trace changes to checks and observed results. Controlled trial readiness is not proof of public or clinical emergency-service readiness.
- EAS Update targets preview only and must use the preview cloud environment. Never force-reload an active incident to apply an update. Publishing is not proof that a phone installed/applied it; record APK/OTA/web results separately in the release log and lab notes.
- The foreground alarm is currently web-tested. Before shipping it as an Android/iOS alarm, replace the native fallback in use-emergency-signal.ts with verified platform audio/haptics and test real devices; never claim background delivery from a Firestore listener or browser audio.
- User clarification 2026-10-23: finish the demo, then build for phone testing. Android preview APK build is authorized after code/web checks; it is not approval for production, OTA, store submission or real emergency operations. iPhone uses the web home-screen installation while Apple Developer/TestFlight is unavailable. Record pending hardware acceptance explicitly.
- User clarification 2026-10-24: prioritize free Android + web; defer iOS native/Apple enrollment until funded. Test multi-account/multi-location flows and real Android devices; do not interpret this as approval to enable billing or accept real emergencies.
