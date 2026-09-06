# Science Step QA contract

This file records regressions that must not come back. Treat it as a release contract, not optional guidance.

## Learning contract
- The root experience is a guided study tool, not a quiz dashboard or marketing page.
- A learner studies one concept at a time: explanation -> meaningful visual/formula -> one check question -> immediate feedback -> next concept.
- Do not require knowledge from a later locked concept to answer the current check question.
- A wrong answer must not advance progress. Explain the misconception in plain Korean and allow an immediate retry.
- A correct answer advances exactly one concept and persists progress locally.
- Finishing every concept in a unit unlocks the next unit.
- Returning to the home screen must preserve completed concepts and unit completion.
- Progress and achievement feedback should be visible but secondary to learning content; do not turn the app into a points-only game.

## Content contract
- Explanations assume weak foundations and introduce only the prerequisite needed for the current concept.
- Physics instructions should establish diagram, given values, target quantity, unit, and direction/sign before calculation where applicable.
- Chemistry instructions should establish conditions, units, state/sign, and reaction coefficients before calculation where applicable.
- Visuals/formulas must carry instructional meaning rather than being decorative.
- School-test traps should be explained inside the lesson when they are central to the concept.
- Content must stay within the declared midterm scope. User-made derivative workbooks are not authoritative scope sources.

## Interaction contract
- Every concept check has exactly four choices and one valid answer index 0..3.
- No unanswered check can be graded.
- Selecting a wrong choice shows explanatory feedback and keeps the learner on the same concept.
- After retrying correctly, the learner can continue without reloading the page.
- Locked units cannot be opened before the previous unit is fully completed.

## Visual contract
Audit at: 390x844, 844x390, 768x1024, 1024x768, 1366x768, 1920x1080.
- No body horizontal overflow.
- No choice, instructional visual, formula, or action is clipped outside the viewport.
- Phone portrait stacks paired instructional panels vertically when necessary.
- Short landscape viewports must remain usable without fixed/sticky controls covering lesson content.
- Diagram text must remain legible on phone portrait.

## UI contract
- Claymorphism is allowed for tactile cards and controls, but contrast and readability take priority.
- Avoid oversized English hero copy, decorative AI-style gradients, excessive glass effects, and giant rounded pills.
- The home screen should immediately expose subject, unit, progress, estimated minutes, and completion state.
- Completion feedback should feel rewarding but remain brief enough for classroom or break-time study.

## Legacy drill data contract
- Existing quiz-data.js remains valid practice data. Every main question has exactly 4 choices, answer 0..3, and exactly 2 remediation questions; every remediation has 4 choices and answer 0..3.
- Test sets do not affect formal learning progress.

## Release gate
`tests/visual-audit.mjs` is the automated acceptance test. A production Pages deployment must depend on this test passing. When a new user-reported regression appears, add a reproducible assertion here and/or to the automated test so the same class of error becomes harder to repeat.
