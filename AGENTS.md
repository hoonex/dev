# Repository guidance

This repository is developed with Sloar Chat Coder as the repository-continuity protocol. Before material repository work, consult the canonical Sloar source at https://github.com/hoonex/sloar-chat-coder and preserve repository truth over chat reconstruction.

Product-specific rules:

- Mobile-first is the primary release surface.
- Preserve the quiet shared-study-room product concept; do not turn the home screen into a generic analytics dashboard.
- Keep Supabase access behind `src/data/repository.js` so the UI can evolve independently from the backend.
- Do not commit `config.js` or service-role credentials.
- Any new database table containing user data must ship with explicit RLS policies.
