# Complete Roadmap Steps 2-6

## Original Request

Review and create a GoalBuddy goal for steps 2-6 of `ROADMAP.md` and `docs/roadmaps/CURRENT_STATE_AND_NEXT.md`, then validate and complete them end to end so the demo is dogfoodable with actionable feedback. The goal must allow agents to operate Vercel and Supabase as needed.

## Interpreted Outcome

The `silly-goose-ledger-demo` roadmap steps 2-6 are validated against the current repo and product state, implemented through successive safe slices, verified locally and against any required Vercel/Supabase surfaces, and closed only when the user can dogfood the demo properly and produce actionable feedback from a working flow.

## Intake Classification

- Shape: existing_plan
- Goal mode: execution with validation-first planning
- Audience: the operator dogfooding the Silly Goose Ledger demo and any agents continuing the work
- Authority: requested for local repo work; Vercel and Supabase access are approved as needed, but destructive production changes, credential exposure, and schema/data resets still require explicit stop-and-escalate handling
- Proof type: test, demo, artifact, review, and deployment/service verification where applicable

## Existing Plan Facts To Preserve

- The source plan lives in `ROADMAP.md`.
- The current-state companion lives in `docs/roadmaps/CURRENT_STATE_AND_NEXT.md`.
- The execution tranche is specifically roadmap steps 2-6, not the entire roadmap.
- The result must be dogfoodable, not merely documented.
- Vercel and Supabase may be used by agents when they are needed to complete or verify the tranche.

## Constraints

- Preserve the local-first WebAuthn/Ledger demo boundary unless the validated roadmap explicitly requires a service-backed slice.
- Treat Supabase as an explicit adapter/service boundary; do not silently replace local demo behavior with cloud persistence.
- Treat Vercel as a deployment/preview/verification surface, not as board truth.
- Do not expose secrets, tokens, Supabase service-role values, or Vercel credentials in receipts.
- Do not run destructive database operations, production data resets, or irreversible Vercel/Supabase changes without a task-level stop and operator approval.
- Keep `state.yaml` as board truth. External issues, PRs, Vercel deployments, and Supabase receipts are supporting artifacts.
- Validate responsive UI and dogfood-critical workflows with browser evidence before final completion.

## Likely Misfire To Avoid

The goal could appear complete by checking boxes in the roadmap or shipping one isolated fix while the actual end-to-end demo remains hard to dogfood, visually broken, locally/cloud inconsistent, or unable to produce actionable feedback.

## Completion Proof

Completion requires a final Judge or PM audit receipt with `full_outcome_complete: true` that maps roadmap steps 2-6 to implemented slices, verification commands, browser dogfood evidence, and any required Vercel/Supabase verification. The audit must say what remains intentionally out of scope or blocked.

## Starter Command

```text
/goal Follow docs/goals/complete-roadmap-steps-2-6/goal.md.
```
