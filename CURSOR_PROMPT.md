# Cursor Build Prompt — Together

Build a production-ready, private couples planning application named **Together**.

Together gives two partners one shared place to create, discuss, assign, and track:

- Tasks
- Decisions that need to be made
- Personal and shared goals
- Financial targets
- Dates, deadlines, comments, progress, and activity history

This should feel like a calm shared home for a relationship—not corporate project-management software.

## Design references

Use these images as the visual contract:

1. `design-references/01-dashboard-desktop.png`
2. `design-references/02-decision-detail-comments.png`
3. `design-references/03-mobile-experience.png`

Match their visual hierarchy, spacing, typography character, card styling, color balance, responsive behavior, and overall warmth. Do not copy any minor text errors that may appear in generated reference images. The written requirements in this prompt control functionality and exact wording.

## Required technical stack

Build with:

- Next.js 15+ App Router
- React and TypeScript in strict mode
- Tailwind CSS
- Supabase for Postgres, authentication, Row Level Security, Storage, and Realtime
- React Hook Form and Zod
- Lucide React icons
- date-fns
- Vitest and React Testing Library
- Playwright for essential end-to-end flows

Use Server Components by default and Client Components only where interaction requires them. Keep business logic out of visual components. Create a clean service/repository layer for Supabase access.

If Supabase credentials are unavailable during the initial build, include a clearly isolated demo-data adapter so the UI can run locally. Do not replace the real database implementation with localStorage.

## Brand and visual system

The direction is **Warm & Personal**.

### Colors

- Page background: `#F6F1E8`
- Card surface: `#FFFCF7`
- Primary text: `#24352D`
- Sage: `#A8B8A2`
- Pale sage: `#DDE5D7`
- Clay primary action: `#C8795D`
- Pale clay: `#F1D8CD`
- Secondary text: `#887B6F`
- Borders: `#E7DED2`
- Success: `#71886C`
- Warning: `#B87947`
- Destructive: `#B4534B`

Do not use a dark theme, glassmorphism, loud gradients, generic analytics charts, or cold corporate blue.

### Typography

- Use Fraunces for page titles, greetings, and important card headings.
- Use Manrope for navigation, forms, labels, buttons, dates, comments, and body text.
- Large desktop greeting: 56–68px with tight line height.
- Mobile greeting: 38–44px.
- Card headings: 25–32px desktop and 20–24px mobile.
- Body: 15–17px.

Load fonts with `next/font/google`.

### Components

- Cards: ivory surface, 1px warm border, 20–24px radius, subtle shadow.
- Inputs: 12–14px radius, visible label, warm focus ring, minimum 44px touch height.
- Primary buttons: clay background, white text, 12–14px radius.
- Secondary buttons: ivory background, forest border/text.
- Status pills: pale sage, pale clay, or warm amber according to state.
- Progress bars: 12–14px tall, fully rounded.
- Icons: restrained Lucide line icons.
- Animation: 160–260ms ease-out. Cards may lift 2px on hover. Progress updates animate. Respect `prefers-reduced-motion`.

## Users, household, and privacy

This is a private two-person workspace.

Implement:

1. Email/password and magic-link authentication.
2. A new user creates a household.
3. The creator invites their partner by email.
4. An invitation is single-use and expires.
5. Each household supports exactly two active members for the MVP.
6. Both partners can view and comment on all household records.
7. Every record must be protected with Supabase Row Level Security so users can access only households where they are active members.
8. Users can edit or delete their own comments. The household record creator or assigned owner can edit the main record. Either partner may complete a shared task or update jointly tracked progress.
9. Store timestamps in UTC and render them in the user’s timezone.

Do not rely only on client-side filtering for privacy.

## Shared record model

Use a common `items` table for shared fields and type-specific detail tables where appropriate.

### Common item fields

- `id`
- `household_id`
- `type`: `task | decision | goal | financial_target`
- `title`
- `description`
- `status`
- `created_by`
- `owner_id`, nullable when owned by both
- `priority`: `low | normal | high`
- `start_date`, nullable
- `due_date`, nullable
- `completed_at`, nullable
- `archived_at`, nullable
- `created_at`
- `updated_at`

### Supporting entities

Create migrations and TypeScript types for:

- `profiles`
- `households`
- `household_members`
- `household_invitations`
- `items`
- `task_checklist_items`
- `decision_options`
- `decision_responses`
- `goal_milestones`
- `financial_contributions`
- `comments`
- `comment_reactions`
- `attachments`
- `activity_events`
- `notifications`

Use foreign keys, indexes, check constraints, and sensible cascade behavior. Add indexes for household, type, status, owner, and due date.

### Statuses

Tasks:

- `not_started`
- `in_progress`
- `blocked`
- `completed`

Decisions:

- `collecting_options`
- `awaiting_response`
- `discussion`
- `decided`

Goals:

- `not_started`
- `on_track`
- `needs_attention`
- `completed`

Financial targets:

- `not_started`
- `on_track`
- `behind`
- `reached`

## Core functionality

### Global create experience

The “Add something” button opens one create flow where the user first chooses:

- Task
- Decision
- Goal
- Financial Target

The form then reveals type-specific fields. Validate with Zod and show inline errors. Preserve unsaved input if the type changes accidentally.

### Tasks

Support:

- Title and description
- Owner: Trevor, Shonda, or Both
- Start date and due date
- Priority
- Checklist/subtasks
- Status
- Comments and reactions
- Attachments
- Completion date
- Full activity history

Provide list, board, and calendar-friendly views. The default mobile view is a list.

### Decisions

Support:

- Question/title and supporting context
- Decision owner
- Decision deadline
- Multiple options
- Pros and cons for each option
- Partner responses or votes
- Comments and threaded replies
- Final outcome
- Decision summary
- Status and complete history

Clearly distinguish “your response is needed” from “waiting for your partner.”

### Goals

Support:

- Personal or shared goal
- Owner
- Start and target dates
- Numeric, percentage, milestone, or habit-based tracking
- Milestones
- Progress entries
- Current progress
- Status
- Comments and history

For recurring habits, allow weekly frequency and display streak/progress without turning the product into a gamified fitness app.

### Financial targets

Support:

- Target name
- Target amount
- Current amount
- Target date
- Owner or shared ownership
- Contribution entries with date, amount, contributor, and optional note
- Automatic progress calculation
- Remaining amount
- Suggested monthly amount required to hit the target date
- Comments and activity history

Store money as integer cents. Never use floating-point storage for currency.

### Comments and activity

Every item type has:

- Chronological comment thread
- Replies
- `@partner` mention
- Simple reactions
- Attachment support
- Edited indicator
- Activity history that records important changes such as created, assigned, due date changed, option added, vote recorded, contribution added, status changed, or completed

Activity events should be generated server-side when mutations succeed.

## Routes and screens

Implement these routes:

- `/`
  - Redirect to dashboard when authenticated, otherwise to sign-in.
- `/sign-in`
- `/onboarding`
- `/invite/[token]`
- `/dashboard`
- `/tasks`
- `/tasks/[id]`
- `/decisions`
- `/decisions/[id]`
- `/goals`
- `/goals/[id]`
- `/finances`
- `/finances/[id]`
- `/calendar`
- `/settings`

### Dashboard

Match `01-dashboard-desktop.png`.

Include:

- Personal greeting for both partners
- “Add something” action
- Tasks due soon
- Decisions awaiting input
- Active goals with progress
- Financial targets with currency progress
- Coming-up timeline
- Recent comment counts
- Empty states that still feel warm and useful

Dashboard cards link to their detail pages and include “View all.”

### Detail pages

Use a responsive two-column layout on desktop:

- Main record content and controls
- Discussion/comments panel

Stack the discussion below the content on smaller screens.

The decision detail should closely follow `02-decision-detail-comments.png`.

### Mobile

Match `03-mobile-experience.png`.

Use a fixed bottom navigation:

- Home
- Tasks
- Decisions
- Goals
- More

The create flow should appear as a bottom sheet on mobile and a centered modal on desktop.

## Calendar and dates

Create a household calendar view containing:

- Task due dates
- Decision deadlines
- Goal target dates
- Financial target dates
- Milestone dates

Include month and agenda views. Clicking an entry opens the item. Provide filters by type and owner.

## Search, filtering, and sorting

All list pages need:

- Search by title and description
- Filter by status
- Filter by owner
- Filter by due-date range
- Sort by due date, recently updated, priority, or progress
- Active and archived tabs

Keep filters synchronized to URL query parameters.

## Notifications

Create in-app notifications for:

- A new assignment
- A partner comment or reply
- A partner mention
- A decision requiring a response
- An approaching or overdue date
- A new contribution or milestone update

Build notification preferences in Settings. Email delivery may be implemented as a clearly separated extension point, but in-app notifications must work.

## Accessibility and quality

Required:

- Semantic HTML
- Full keyboard navigation
- Visible focus indicators
- Proper form labels and error messages
- Accessible dialogs and bottom sheets
- Sufficient color contrast
- Touch targets of at least 44×44px
- No color-only status communication
- Loading, empty, success, and error states
- Optimistic updates only where rollback is safe
- Error boundaries for main application areas
- Responsive layouts at 390px, 768px, 1024px, and 1440px

## Seed data

Include a seed script with a household for Trevor and Shonda containing:

- Tasks:
  - Grocery shop for the week
  - Book dentist appointments
  - Pay electric bill, completed
  - Plan Memorial Day weekend
- Decision:
  - Summer vacation location
  - Options: Lake cabin, Beach trip, Staycation
- Goal:
  - Weekly date night, 7 of 12 weeks
- Financial target:
  - Emergency fund, $8,400 of $12,000
- Realistic comments, dates, activity events, and notifications

Never use production secrets in seed files.

## Testing

Add:

- Unit tests for progress calculations, financial monthly-target calculations, validation schemas, authorization helpers, and date/status utilities.
- Component tests for create item, comments, decision voting, task completion, and financial contributions.
- Playwright flows for:
  1. Sign in and view the shared dashboard.
  2. Create a task and assign it to the partner.
  3. Comment on a decision and record a response.
  4. Add a financial contribution and verify updated progress.
  5. Confirm one household cannot access another household’s item.

## Documentation

Create:

- `README.md`
- `.env.example`
- Supabase migrations
- Seed script
- Setup instructions
- Local development commands
- Testing commands
- Deployment instructions for Vercel and Supabase
- A short architecture explanation
- A checklist of any configuration that must be completed manually

## Implementation process

Work in these phases:

1. Set up the project, design tokens, fonts, base layout, and reusable components.
2. Add the Supabase schema, migrations, RLS policies, generated types, and authentication.
3. Build onboarding and partner invitation.
4. Build the dashboard and global create flow.
5. Build Tasks.
6. Build Decisions and discussion.
7. Build Goals.
8. Build Financial Targets.
9. Build calendar, search, filtering, notifications, settings, and archives.
10. Add responsive refinement, accessibility, tests, documentation, and final QA.

After each phase:

- Run type checking.
- Run linting.
- Run relevant tests.
- Fix errors before continuing.
- Keep the app runnable.

Do not leave major screens as placeholders. Do not use fake buttons. All primary actions shown in the interface must work.

## Definition of done

The MVP is complete when:

- Two authenticated partners can securely share one household.
- Either partner can create and track every supported item type.
- Both can comment, reply, react, and review history.
- Dates and upcoming deadlines are visible and filterable.
- Decision responses and final outcomes are recorded.
- Goal progress and milestones work.
- Financial contributions accurately update currency progress.
- The desktop and mobile experience closely matches the supplied references.
- RLS prevents cross-household access.
- Core tests pass.
- The project can be deployed using the documented steps.

Begin by inspecting the three design references. Then create a short implementation plan and proceed with phase one without asking broad discovery questions. Ask only when a missing choice would materially block the build.
