# Science Drill QA contract

This file records regressions that must not come back. Treat it as a release contract, not optional guidance.

## Content contract
- Every main question has exactly 4 choices and one answer index 0..3.
- Every main question has exactly 2 remediation questions.
- Every remediation question has exactly 4 choices and one answer index 0..3.
- Remediation must test the same core concept in a changed representation or situation. Do not only reorder choices or swap a number.
- If the main miss is visual/data interpretation, at least one retry should use a visual, graph, table, diagram, or another representation when the concept supports it.
- A missing remediation bank must never be silently marked complete.

## Functional contract
- Unanswered main questions must not be silently counted as wrong. Block grading and move the learner to the first unanswered question.
- Intentionally answering every main question wrong must display exactly 2 similar-practice questions per missed main question.
- Retry questions must be selectable and gradable.
- A partial retry pass preserves already-correct retry questions. Correct retry questions must never be forced on the learner again.
- After partial retry grading, only the still-wrong retry questions return.
- The retry result must state in plain language how many similar questions are already correct and how many remain.
- Solving the final remaining retry sets remediationDone=true.
- Test sets do not affect overdue/progress logic.
- Regular sets cannot be completed until required retries are passed.

## Retry UX language contract
- User-facing copy must describe the action, not internal mechanics.
- Prefer: `틀린 문제 다시 연습`, `비슷한 문제`, `남은 N문제`, `틀린 N문제 다시 풀기`.
- Do not show ambiguous internal terms such as `보강 1/2`, `오답 보강`, `완료 처리`, `remediation`, or bare fractions with no explanation.
- Explain the loop once: `틀린 문제마다 비슷한 문제 2개 → 맞힌 건 끝 → 틀린 것만 다시 풀기 → 전부 맞히면 끝`.

## Visual contract
Audit at: 390x844, 844x390, 768x1024, 1024x768, 1366x768, 1920x1080.
- No body horizontal overflow.
- No question choice or visual is clipped outside the viewport.
- Short landscape viewports must not have sticky action bars covering diagrams.
- Phone portrait compares multi-state piston diagrams vertically; larger viewports may use columns.
- Graph ticks should use readable school-exam-style values, not arbitrary long decimals.
- Vector labels must not overlap when vectors share a direction.
- Projectile diagrams should use a physically sensible parabolic curve rather than a wavy generic spline.
- Diagram text must remain legible on phone portrait.

## UI contract
- The site is a study tool, not a marketing landing page.
- Avoid oversized English hero copy, decorative AI-style gradients, excessive glass effects, and giant rounded pills.
- Keep the header compact and task-focused: exam, subjects, current status, account.
- The current visual direction is neutral light gray/white with modest borders and restrained blue accents.

## Release gate
`tests/visual-audit.mjs` is the automated acceptance test. A production Pages deployment must depend on this test passing. When a new user-reported regression appears, add a reproducible assertion here and/or to the automated test so the same class of error becomes harder to repeat.
