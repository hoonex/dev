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
- Intentionally answering every main question wrong must display 2 retry questions per missed question.
- Retry questions must be selectable and gradable.
- Test sets do not affect overdue/progress logic.
- Regular sets cannot be completed until required retries are passed.

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
