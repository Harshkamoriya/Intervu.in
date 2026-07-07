# Navigation Guide

## Header Navigation Structure

### Landing Page / Public Pages (NOT LOGGED IN)

```
┌─────────────────────────────────────────────────────────────┐
│  [Intervu]  Features  Solutions  Pricing  About  [SignIn]  [Get Started]  │
└─────────────────────────────────────────────────────────────┘
```

**Links and Actions**:
- **Intervu Logo** → `/` (home page)
- **Features** → `#features` (scroll to features section)
- **Solutions** → `#solutions` (scroll to solutions section)
- **Pricing** → `#pricing` (scroll to pricing section)
- **About** → `#about` (scroll to about section)
- **Sign In** → Opens Clerk modal (Sign in with email/Google)
- **Get Started** → `/candidate/dashboard` (redirects to dashboard after login)

---

### Candidate Portal (LOGGED IN)

```
┌──────────────────────────────────────────────────────────────┐
│  [Intervu]  Dashboard  Interviews  Reports  [UserButton]  │
└──────────────────────────────────────────────────────────────┘
```

**Links and Actions**:
- **Intervu Logo** → `/` (redirects to home, then back to dashboard on login)
- **Dashboard** → `/candidate/dashboard` (home for logged-in users)
- **Interviews** → `/candidate/interviews` (interview hub with practice options)
- **Reports** → `/candidate/reports` (analytics and interview history)
- **UserButton** → Clerk user menu (profile, settings, sign out)

---

## Candidate Portal Routes

### Dashboard (`/candidate/dashboard`)
**Purpose**: Overview of user progress and recommendations

**Key Sections**:
- Greeting with pending invitations
- Quick stats (Pending Tests, Interviews, Days Active)
- AI Coach Recommendations
- Progress Overview (6 metrics)
- Skill Analytics (6 skill bars)
- Resume Health (ATS score)
- Learning Roadmap (structured path)
- Recent applications sidebar

**Next Actions**:
- View Interviews Hub: Click "Interviews" in header
- View Reports: Click "Reports" in header

---

### Interviews (`/candidate/interviews`)
**Purpose**: Discover and practice interviews

**Key Sections**:
1. **Continue Interview** - Resume unfinished session
2. **Quick Start** - 6 interview types (General, Technical, HR, Behavioral, Resume-Based, JD-Based)
3. **AI Custom Interview** - Generate personalized interview with custom parameters
4. **Recommended Interviews** - AI-suggested interviews based on performance
5. **Interview Library** - 6 pre-built interview collections
6. **Practice Tracks** - Structured learning paths with progress tracking
7. **Interview History** - List of completed interviews (CLICKABLE → `/candidate/reports/[sessionId]`)

**Navigation**:
- Click any history item → View detailed report for that interview
- Start an interview → Redirects to interview session page
- "Interviews" header link → Stays on current page with active highlight

---

### Reports Hub (`/candidate/reports`)
**Purpose**: Analytics and performance tracking

**Key Sections**:
1. **Performance Overview** - 5 key metrics cards
2. **Skill Breakdown** - Progress bars for 6 technical skills
3. **Topic-wise Analysis** - Performance by topic area
4. **Interview History** (MAIN SECTION):
   - **Search Bar** - Filter by role or coach name
   - **Sort Dropdown** - Sort by: Newest First, Highest Score, Lowest Score
   - **Interview List** - All completed interviews with:
     - Interview role/name
     - Completion date
     - Overall score
     - Link to detailed report (CLICKABLE)
5. **AI Coach Insights** - Weakest topics and recommendations
6. **Export Reports** - Download as PDF or CSV

**Navigation**:
- Click any interview in history → `/candidate/reports/[sessionId]` (report detail)
- Click "Dashboard" header link → `/candidate/dashboard`
- Click "Interviews" header link → `/candidate/interviews`

---

### Report Detail (`/candidate/reports/[sessionId]`)
**Purpose**: Deep dive into a specific interview performance

**Key Sections**:
1. **Header** with back button and action buttons (Download, Share)
2. **Score Card** - Large score display, verdict, metadata
3. **Feedback** - AI coach written feedback
4. **Strengths & Weaknesses** - Side-by-side comparison
5. **Recommendations** - Numbered actionable items
6. **Next Steps CTA** - Button to start another interview

**Navigation**:
- Back Button → `/candidate/reports` (back to reports hub)
- "Start Another Interview" Button → `/candidate/interviews`
- Header links → Same as other pages

---

## URL Map

```
/                              → Home/Landing page (public)
├── /candidate
│   ├── /dashboard             → Dashboard (protected)
│   ├── /interviews            → Interview Hub (protected)
│   │   └── /[id]              → Interview session (protected)
│   └── /reports               → Reports Hub (protected)
│       └── /[sessionId]       → Report Detail (protected)
├── /sign-in                   → Clerk sign-in page (redirects from protected routes)
└── /sign-up                   → Clerk sign-up page (if enabled)
```

---

## Mobile Navigation

### Mobile - NOT LOGGED IN
```
┌──────────────────────────┐
│  [Intervu]     [Menu ☰]  │
├──────────────────────────┤
│  Features                │
│  Solutions               │
│  Pricing                 │
│  About                   │
│  [Sign In Button]        │
└──────────────────────────┘
```

### Mobile - LOGGED IN
```
┌──────────────────────────┐
│  [I]          [Menu ☰]   │
├──────────────────────────┤
│  Dashboard               │
│  Interviews              │
│  Reports                 │
│  [User Profile Button]   │
└──────────────────────────┘
```

---

## Active Link Highlighting

The header displays active link highlighting based on current route:

| Current Route | Active Nav Item |
|---|---|
| `/` | Logo (Intervu) |
| `/candidate/dashboard` | Dashboard |
| `/candidate/interviews` | Interviews |
| `/candidate/interviews/[id]` | Interviews |
| `/candidate/reports` | Reports |
| `/candidate/reports/[sessionId]` | Reports |

---

## Authentication Flow

```
User Opens App
    ↓
Is user signed in? (useAuth())
    ↓
    ├→ YES → Show logged-in header
    │        Dashboard / Interviews / Reports / UserButton
    │
    └→ NO → Show public header
             Features / Solutions / Pricing / About / Sign In / Get Started
                ↓
             Click "Sign In" → Clerk modal opens
                ↓
             Enter email/password or Google OAuth
                ↓
             Clerk validates and creates session
                ↓
             Redirect to `/candidate/dashboard`
                ↓
             Header updates to logged-in state
```

---

## Key Navigation Features

1. **Auth-Aware Navigation** - Header content changes based on login state
2. **Responsive Design** - Mobile menu for smaller screens
3. **Active Link Highlighting** - Visual indicator of current page
4. **Smooth Transitions** - Navigation changes animate smoothly
5. **Deep Linking** - Can navigate directly to any page if authenticated
6. **Proper Back Navigation** - Back buttons maintain navigation history
7. **Consistent UX** - Same navigation structure across all authenticated pages

---

## User Journeys

### New User Journey
1. Land on `/` (public landing page with header)
2. Click "Get Started" or "Sign In" → Clerk modal
3. Complete sign-up process
4. Redirected to `/candidate/dashboard` with logged-in header
5. Explore dashboard, then click "Interviews" → `/candidate/interviews`
6. Complete an interview
7. Interview added to history
8. Click report in history → `/candidate/reports/[sessionId]`
9. View detailed feedback
10. Return to reports hub or start another interview

### Returning User Journey
1. Already signed in (Clerk session exists)
2. Open app → See logged-in header
3. Navigate between Dashboard, Interviews, Reports using header links
4. Can go directly to any page via header navigation
5. All data persists and updates in real-time

