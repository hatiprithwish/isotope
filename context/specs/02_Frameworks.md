Build a structured form that generates a personalized natural-language framework document, which gets injected into the company research AI cron at runtime.

The flow: Form → AI generates framework text → user reviews/edits → save (versioned in DB)

The design is present at `./design/screens/onboarding/jsx`

Create the form for both mobile & desktop devices as per design. Use tailiwind. Follow project rules.

The form will live under `onboarding/wizard/step-1` route.

User should be able to change their framework whenever from `settings` page. So we'll have one shared form `CompanyResearchFrameworkForm.tsx` which will be used in both places.

The form fields:

- Salary range (min–max LPA)
- Acceptable locations (multi-select + free text)
- Ethics red flags to check (multi-select + free text, pre-populated)
- Scored criteria — the meaty part: repeatable per-criterion form with criterion name, why it matters, what to look for, and weight (0–5). User can add/remove/reorder. No fixed count.
- Decision band thresholds — where Strong Fit / Conditional Fit lines are (as % of max score)
- Auto No-Go flags — which criteria, if scored 0, kill the company regardless of total

Defaults: All pre-populated from Appendix A (P1–P8 criteria with weights). User edits to personalise.
Settings behaviour: Editable anytime. Every save = new versioned row. Last 5 versions restorable. AI always fetches latest at runtime — never cached.
The "See an example" panel: Collapsible in the onboarding wizard, showing a filled form + excerpt of generated text + one line explaining the downstream AI effect.
