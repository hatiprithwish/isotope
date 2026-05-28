# Isotope — AI-Powered Job Search Operations Platform

## Overview

Isotope is a multi-user, AI-first web application that helps software engineers manage their entire job search pipeline — from company discovery and research, to contact outreach, to application tracking. AI handles research, drafting, sequencing, and daily prioritisation automatically overnight; humans only review, approve, and send. The mental model is a **calm daily ritual**: the user arrives each morning, sees exactly what needs attention on the Today screen, acts on it, and leaves feeling in control.

## Goals

1. Eliminate the daily overhead of job search management — company research, contact finding, and email drafting all run automatically overnight with zero manual trigger required.
2. Keep humans in control at every consequential gate — companies are reviewed before contacts are found, drafts are reviewed before any message is sent.
3. Ensure AI output stays consistent and personalised across sessions using user-owned frameworks that the LLM fetches fresh at runtime.
4. Surface the day's priorities on a single Today screen so the user spends ≤30 minutes per day inside the app.
5. Track outreach performance via built-in A/B testing so the user can continuously improve reply rates.

## Core User Flow

1. User signs up via Clerk (email/password or social SSO).
2. User chooses Quick Start (seeded default frameworks, skip wizard) or Full Setup (3-step onboarding wizard).
3. User adds companies they are interested in — manually or via AI job discovery.
4. Overnight cron (1:00 AM) runs 3-stage company research: pre-filter → ethics gate → scored criteria. Company moves to **Waiting for Human**.
5. User reviews company on Today screen or Companies page. Accepts or rejects.
6. On acceptance, cron finds contacts via Apollo — pre-dedup → enrich → personalisation research via Claude Haiku. Company moves to **Contacts Added**.
7. Overnight cron drafts Touch 1 outreach (email + LinkedIn) for each new contact. Contact moves to **Draft Ready**.
8. User reviews draft, copies it, sends manually, clicks "Mark as Sent". Contact moves to **In Pipeline**.
9. 7 days later (no reply) → cron drafts Touch 2. Then Touch 3. Then → **Dead** → 60 days later → **Re-Engage** → 3-touch restart.
10. User monitors overall progress and A/B test results in Settings → Analytics.
11. Morning digest email (8:00 AM default) summarises everything needing action with deep links.

## Features

### Today Dashboard

- 7 action sections: Needs your input, Needs attention, Drafts ready (with stalled inline), Stalled drafts, Companies to review, Jobs to review, Follow-ups due today
- Desktop right column: AI Activity Card (overnight run stats) + Pipeline Glance Card (4 pipeline counters)
- Desktop topbar: date/time, notification bell, "Preview digest" button

### Companies Pipeline

- Add companies manually or accept AI-suggested companies from job discovery
- 3-stage AI research: Stage 1 pre-filters (salary + location), Stage 2 ethics gate, Stage 3 scored criteria (user-configurable weights)
- Fit band scoring: Strong Fit (≥80% of max) / Conditional Fit (60–79%) / Weak Fit (<60%) / Disqualified
- User context field — freetext injected into AI scoring prompt
- Score stepper to override AI criterion scores when Waiting for Human
- Linked contacts + linked jobs visible from company detail panel

### Contacts & Outreach

- Apollo-powered contact discovery (enrichment via people/match, 1 credit per person)
- Pre-dedup before enrichment (saves credits); post-enrichment LinkedIn URL dedup
- Personalisation research via 3 DuckDuckGo searches + Claude Haiku summary
- 3-touch outreach sequence (7-day intervals) across email + LinkedIn
- AI drafts all touches; user copies and sends manually
- "Mark as Sent" → inline confirm row (no modal)
- Re-engagement after 60 days Dead: 3-touch restart with full history as context
- Built-in A/B testing on outreach variable (subject line default; 4 others available)
- 3-tab contact panel: Draft | History | About

### Jobs Discovery

- AI-suggested jobs via Job Search Framework (weekly or on-demand)
- Manual job entry with JD paste
- Jobs reviewed, accepted (triggers company research if company not in DB), or rejected

### Morning Digest Email

- Daily HTML email via Resend from `digest@isotope.work`
- 4 sections: Needs your input / Drafts ready (stalled inline) / Companies to review / Needs attention
- Plain app URLs — no signed tokens, no expiry; Clerk handles auth

### Settings

- **Frameworks tab**: edit user-owned frameworks (Company Research, Job Search, A/B Testing) via form → generated text → review → save flow. Fixed system prompts shown read-only.
- **Analytics tab**: A/B reply rate table + bar chart. Threshold: ≥20 contacts per variant.
- **Digest tab**: time selector (7/8/9 AM + custom), timezone, delivery address, next digest preview.
- **Account tab**: profile, connected accounts, danger zone.

### Onboarding

- Two paths: Quick Start (seeded defaults, 30 sec) or Full Setup (3-step wizard, ~8 min)
- Wizard covers: Company Research Framework, Job Search Framework, A/B Testing Configuration
- Each step: form → generated text → review → save. Skippable (flagged incomplete, blocks AI jobs).

## Scope

### In Scope (V1)

- Multi-user web app (responsive — desktop primary, mobile supported)
- Clerk authentication (email/password + social SSO)
- AI company research (3-stage: pre-filter, ethics, scored criteria)
- Apollo contact enrichment with pre-dedup and post-enrichment dedup
- Claude Haiku personalisation research per contact
- AI email + LinkedIn DM draft generation (Touch 1/2/3 + re-engagement)
- 3-touch outreach sequencer with 7-day intervals
- Re-engagement after 60 days with full history context
- A/B testing on outreach variable with reply rate analytics
- Morning digest email via Resend
- User-owned frameworks (Company Research, Job Search, A/B Testing) — form builder + versioning (5 versions retained)
- Fixed system prompts (Email Drafting, Contact Search) — codebase level, not per user
- Job discovery via AI (weekly or on-demand) + manual job entry
- Today screen as primary daily landing page
- Settings: Frameworks, Analytics, Digest, Account tabs

### Out of Scope (V1)

- LinkedIn API integration — all LinkedIn DM actions are manual copy-paste in V1 _(Post-V1 priority)_
- Automated job portal scraping — job discovery uses AI-assisted search, not structured crawling _(Post-V1 priority)_
- Auto-sending emails — user always copies draft and sends manually
- Gmail API integration — no inbox sync, no auto-send, no open/click tracking
- Team or shared workspaces — all data is per-user
- Calendar integration
- Native mobile app — responsive web is the V1 mobile experience
- Automated open/click tracking — reply tracking is manual ("Mark as Replied")

## Success Criteria

1. A signed-in user can add a company and see AI research results (fit score, ethics gate, summary) appear the following morning without any manual trigger.
2. A user can review a company, accept it, and see contacts auto-discovered and drafted within 24 hours.
3. A user can copy a draft, send it manually, mark it as sent, and the sequence advances correctly (Touch 2 drafted 7 days later).
4. The morning digest email arrives at the configured time with accurate deep links to all items needing action.
5. A/B analytics accurately tracks reply rates per variant and surfaces data once ≥20 contacts per variant are reached.
6. All user-owned frameworks are editable, versioned, and the LLM always uses the latest saved version at runtime (never cached).
7. All data is correctly scoped to the authenticated user — no cross-user data access possible.
8. The app is fully usable on mobile (responsive) with bottom tab bar navigation.
