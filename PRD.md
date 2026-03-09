# PRD: Real-Time Collaborative Task Manager

## 1. Overview

A full-stack collaborative task management system where multiple users manage projects and tasks simultaneously with real-time synchronization. The system provides a REST API backend with WebSocket-powered live updates and a polished, Linear-inspired Next.js frontend with animations.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Frontend | Next.js 14 (App Router, React 18) |
| UI Components | shadcn/ui + Tailwind CSS |
| Animations | Framer Motion |
| Drag & Drop | dnd-kit |
| State Management | Zustand |
| Backend API | Custom Express server wrapping Next.js |
| Database | MongoDB (Mongoose ODM) |
| Real-Time | Socket.io (WebSockets) |
| Authentication | JWT (JSON Web Tokens) |
| Validation | Zod |
| Testing | Jest + Supertest |

---

## 3. Data Models

### 3.1 User
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `name` | String | Required |
| `email` | String | Unique, indexed |
| `password` | String | Hashed (bcrypt) |
| `avatar` | String | Optional URL |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

### 3.2 Project
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `name` | String | Required |
| `description` | String | Optional |
| `owner` | ObjectId | Ref: User |
| `members` | [ObjectId] | Ref: User — collaborators list |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indexes:** `{ owner: 1 }`, `{ members: 1 }`

### 3.3 Task
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `title` | String | Required, text-indexed |
| `description` | String | Optional, text-indexed |
| `status` | String | Enum: `todo`, `in_progress`, `in_review`, `done` |
| `priority` | String | Enum: `low`, `medium`, `high`, `urgent` |
| `project` | ObjectId | Ref: Project |
| `assignees` | [ObjectId] | Ref: User |
| `createdBy` | ObjectId | Ref: User |
| `dueDate` | Date | Optional |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indexes:**
- `{ project: 1, createdAt: -1 }` — dashboard listing (compound)
- `{ project: 1, status: 1 }` — filter by status
- `{ project: 1, assignees: 1 }` — filter by assignee
- `{ title: "text", description: "text" }` — full-text search

### 3.4 Comment (Referenced)
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `content` | String | Required, text-indexed |
| `task` | ObjectId | Ref: Task |
| `author` | ObjectId | Ref: User |
| `createdAt` | Date | Auto |

**Indexes:** `{ task: 1, createdAt: 1 }`

> **Design Decision — Referenced Comments:** Comments are stored in a separate collection rather than embedded in Tasks. This avoids the 16MB document size limit, allows independent pagination of comments, and supports text search across comments without loading entire task documents. The tradeoff is an extra query for comments, mitigated by indexing on `task` field.

---

## 4. API Endpoints

### 4.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user profile |

### 4.2 Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List user's projects |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project (owner only) |
| POST | `/api/projects/:id/members` | Add member to project |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### 4.3 Tasks (scoped to project)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:projectId/tasks` | Create task |
| GET | `/api/projects/:projectId/tasks` | List tasks (with filters & cursor pagination) |
| GET | `/api/projects/:projectId/tasks/:id` | Get task details |
| PUT | `/api/projects/:projectId/tasks/:id` | Update task |
| DELETE | `/api/projects/:projectId/tasks/:id` | Delete task |
| POST | `/api/projects/:projectId/tasks/:id/assign` | Assign users |
| DELETE | `/api/projects/:projectId/tasks/:id/assign` | Unassign users |

**Query Parameters for GET tasks:**
- `status` — filter by status
- `assignee` — filter by assignee ID
- `cursor` — cursor for pagination (encoded `createdAt` timestamp)
- `limit` — items per page (default: 20, max: 100)

### 4.4 Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/:taskId/comments` | Add comment |
| GET | `/api/tasks/:taskId/comments` | List comments (cursor paginated) |

### 4.5 Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/search?q=term` | Full-text search across tasks & comments |

---

## 5. Real-Time Features (Socket.io)

### 5.1 Connection Flow
1. Client connects with JWT in auth handshake
2. Server validates token, associates socket with user
3. Client joins project room: `project:<projectId>`

### 5.2 Events

**Server → Client:**
| Event | Payload | Trigger |
|-------|---------|---------|
| `task:created` | Task object | New task created |
| `task:updated` | Task object | Task edited/status changed |
| `task:deleted` | `{ taskId }` | Task removed |
| `comment:added` | Comment object | New comment on task |
| `presence:update` | `{ users: [...] }` | User joins/leaves project |

**Client → Server:**
| Event | Payload | Purpose |
|-------|---------|---------|
| `project:join` | `{ projectId }` | Subscribe to project updates |
| `project:leave` | `{ projectId }` | Unsubscribe |

### 5.3 Presence Detection
- Track connected users per project room
- Broadcast `presence:update` on join/disconnect
- Include user `_id`, `name`, and `avatar` in presence list
- **UI:** Overlapping avatar stack with green pulse dots in the top bar (Figma-style)

### 5.4 Real-Time Update UX
- Task changes animate instantly on all connected clients
- Subtle toast notification: "Akshay moved Task X to Done"
- Cards animate smoothly to new positions via Framer Motion layout animations

---

## 6. Pagination Strategy

**Cursor-based pagination** using `createdAt` timestamps:

```
GET /api/projects/:id/tasks?cursor=2024-01-15T10:30:00Z&limit=20
```

**Response shape:**
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "2024-01-15T08:20:00Z",
    "hasMore": true
  }
}
```

> **Design Decision — Cursor vs Offset:** Cursor-based pagination is chosen over offset because it handles real-time inserts/deletes gracefully (no skipped or duplicated items), performs consistently regardless of page depth (no `skip(N)` overhead), and pairs naturally with the `{ project, createdAt }` compound index.

---

## 7. Authentication & Authorization

- **JWT** issued on login, sent via `Authorization: Bearer <token>` header
- **Middleware** validates token on all protected routes
- **Project-level authorization:** Only project members can access project resources
- **Owner-level actions:** Only project owner can delete project or manage members
- **Password hashing:** bcrypt with salt rounds of 10
- **Collaboration:** Add/remove members by email. No invite links or email notifications (spec-only scope)

---

## 8. Error Handling

Global error middleware with consistent response format:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [...]
  }
}
```

Standard HTTP status codes: 400, 401, 403, 404, 409, 422, 500.

---

## 9. Validation (Zod)

All request bodies and query parameters validated with Zod schemas:
- Registration: email format, password strength (min 8 chars)
- Task creation: required fields, valid status enum
- Pagination: cursor format, limit range
- Search: minimum query length (2 chars)

---

## 10. Testing Strategy

**Framework:** Jest + Supertest

**Unit tests (minimum required):**
1. **Cursor pagination logic** — correct cursor encoding/decoding, boundary handling
2. **Authorization middleware** — token validation, project membership checks

**Additional recommended tests:**
- Task CRUD operations
- Search functionality
- WebSocket event emission

---

## 11. UI/UX Specification

### 11.1 Design Language
- **Style:** Linear-inspired — dark mode default, subtle gradients, tight spacing, sharp corners, monospace accents
- **Color Mode:** Both dark and light mode with toggle. System preference detection on first visit
- **Components:** shadcn/ui as the component system, Tailwind CSS for styling
- **Typography:** Inter for body, JetBrains Mono for code/IDs

### 11.2 Layout Structure
```
┌──────────────────────────────────────────────────┐
│  Top Bar: Search (Cmd+K) | Presence | Theme | User │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Sidebar  │  Main Content Area                    │
│          │                                       │
│ Projects │  (Board / Project Cards / Auth)        │
│ - Alpha  │                                       │
│ - Beta   │                                       │
│ - Gamma  │                                       │
│          │                                       │
│ [+ New]  │                                       │
└──────────┴───────────────────────────────────────┘
```
- **Sidebar:** Collapsible, lists projects, quick-create button
- **Top bar:** Command palette trigger (Cmd+K), presence avatars, theme toggle, user menu

### 11.3 Pages

**Auth (Login/Register) — Split Screen:**
```
┌─────────────────┬────────────────┐
│                 │                │
│   Gradient/     │   Login Form   │
│   Brand Area    │   ─────────    │
│                 │   [Email    ]  │
│   Task Master   │   [Password ]  │
│   tagline       │   [Sign In  ]  │
│                 │                │
│                 │   No account?  │
│                 │   Register →   │
└─────────────────┴────────────────┘
```
- Animated transition between login and register forms
- Left side: subtle animated gradient or mesh background

**Project List — Card Grid:**
```
┌──────────────────────────────────┐
│  My Projects              + New  │
│                                  │
│  ┌─────────┐ ┌─────────┐       │
│  │Project A│ │Project B│       │
│  │ 5 tasks │ │ 12 tasks│       │
│  │ 3 users │ │ 7 users │       │
│  └─────────┘ └─────────┘       │
└──────────────────────────────────┘
```
- Hover: card lifts with shadow + subtle scale
- Staggered entrance animation on page load

**Kanban Board:**
```
┌──────────┬──────────┬──────────┬──────────┐
│   Todo   │ Progress │ Review   │   Done   │
│   (4)    │   (3)    │   (2)    │   (5)    │
├──────────┼──────────┼──────────┼──────────┤
│┌────────┐│┌────────┐│┌────────┐│┌────────┐│
││ Task 1 │││ Task 4 │││ Task 7 │││ Task 9 ││
││ 🟠 High │││ 🔴 Urg  │││ 🟡 Med  │││ 🟢 Low  ││
││ (AK)(RJ)│││ (SM)   │││ (AK)   │││ (RJ)   ││
│└────────┘│└────────┘│└────────┘│└────────┘│
│┌────────┐│          │          │          │
││ Task 2 ││          │          │          │
│└────────┘│          │          │          │
└──────────┴──────────┴──────────┴──────────┘
```

**Task Card (Compact with Metadata):**
```
┌──────────────────────────┐
│ 🔴 Fix auth redirect bug   │
│                          │
│ 🟠 High   Due: Mar 15      │
│ (👤AK) (👤RJ)    💬 3       │
└──────────────────────────┘
```
- Left border color indicates priority
- Assignee avatars with tooltip on hover
- Comment count icon
- Drag: card scales up slightly, shadow deepens, placeholder appears

**Task Detail — Slide-Over Panel:**
```
┌──────────────────────┬────────────┐
│                      │            │
│   Kanban Board       │  Task      │
│   (dimmed/visible)   │  Detail    │
│                      │  Panel     │
│                      │            │
│                      │  Title     │
│                      │  Status    │
│                      │  Priority  │
│                      │  Assignees │
│                      │  Due Date  │
│                      │  ────────  │
│                      │  Comments  │
│                      │            │
└──────────────────────┴────────────┘
```
- Slides in from right with spring physics (Framer Motion)
- Backdrop dims the board slightly
- Editable fields inline
- Comments thread at bottom with real-time additions

**Command Palette (Cmd+K):**
```
┌────────────────────────────────┐
│ 🔍 Search tasks, projects...    │
├────────────────────────────────┤
│ > Fix auth bug         #task   │
│   Setup CI/CD          #task   │
│   Auth module        #comment  │
│   Project Alpha      #project  │
└────────────────────────────────┘
```
- Searches across tasks (title, description), comments, and projects
- Keyboard navigable (arrow keys + enter)
- Grouped results by type

### 11.4 Animation Spec (Framer Motion)

| Animation | Type | Details |
|-----------|------|---------|
| Page transitions | Fade + slide | 200ms ease-out, slide-up 8px on enter |
| Card drag | Scale + shadow | Scale to 1.03 on pickup, spring drop animation |
| Slide-over panel | Spring slide | `type: "spring", damping: 25, stiffness: 300` |
| Card entrance | Stagger | Cards fade in with 30ms stagger delay per card |
| Button hover | Scale | Scale to 1.02, 100ms transition |
| Button press | Scale | Scale to 0.98, 50ms transition |
| Toast notification | Slide + fade | Slide in from top-right, auto-dismiss after 3s |
| Loading skeletons | Pulse | Shimmer effect on placeholder cards |
| Presence dots | Pulse | Green dot with CSS pulse animation |
| Status badge change | Color morph | Smooth background-color transition |
| Modal/palette open | Scale + fade | Scale from 0.95, opacity 0→1, 150ms |
| Sidebar collapse | Width + fade | Content fades, width animates to icon-only |

---

## 12. Project Structure

```
task-master/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Auth layout group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx         # Split-screen auth layout
│   │   ├── (dashboard)/           # Protected layout group
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx       # Project card grid
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Kanban board
│   │   │   └── layout.tsx         # Sidebar + top bar shell
│   │   ├── api/                   # Next.js API routes
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── projects/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── members/route.ts
│   │   │   │       ├── tasks/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── [taskId]/
│   │   │   │       │       ├── route.ts
│   │   │   │       │       └── assign/route.ts
│   │   │   │       └── search/route.ts
│   │   │   └── tasks/
│   │   │       └── [taskId]/
│   │   │           └── comments/route.ts
│   │   ├── layout.tsx             # Root layout (providers, fonts)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── board/
│   │   │   ├── kanban-board.tsx   # Board container
│   │   │   ├── board-column.tsx   # Status column
│   │   │   ├── task-card.tsx      # Draggable task card
│   │   │   └── task-detail-panel.tsx # Slide-over panel
│   │   ├── projects/
│   │   │   ├── project-card.tsx
│   │   │   └── create-project-dialog.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── top-bar.tsx
│   │   │   ├── presence-avatars.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── search/
│   │   │   └── command-palette.tsx # Cmd+K search
│   │   └── auth/
│   │       ├── login-form.tsx
│   │       └── register-form.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── connect.ts         # MongoDB connection
│   │   │   └── models/
│   │   │       ├── user.ts
│   │   │       ├── project.ts
│   │   │       ├── task.ts
│   │   │       └── comment.ts
│   │   ├── auth.ts                # JWT utilities
│   │   ├── validations/           # Zod schemas
│   │   │   ├── auth.ts
│   │   │   ├── project.ts
│   │   │   ├── task.ts
│   │   │   └── comment.ts
│   │   ├── socket.ts              # Socket.io server setup
│   │   └── utils.ts               # Shared utilities
│   ├── hooks/
│   │   ├── use-socket.ts          # Socket.io client hook
│   │   ├── use-presence.ts        # Online users hook
│   │   └── use-debounce.ts
│   ├── stores/
│   │   ├── auth-store.ts          # Zustand auth state
│   │   ├── board-store.ts         # Zustand board/task state
│   │   └── ui-store.ts            # Sidebar, panel, theme state
│   ├── middleware.ts              # Next.js middleware (auth redirect)
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── server.ts                      # Custom server (Express + Socket.io + Next.js)
├── tests/
│   ├── unit/
│   │   ├── pagination.test.ts
│   │   └── auth-middleware.test.ts
│   └── integration/
├── .env.example
├── PRD.md
├── README.md
├── package.json
├── tailwind.config.ts
├── components.json                # shadcn/ui config
└── tsconfig.json
```

---

## 13. Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/task-master

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## 14. Deployment Strategy

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend (Next.js) | Vercel | Static + SSR via Vercel |
| WebSocket server | Railway/Render | Separate process for Socket.io |
| Database | MongoDB Atlas | Free tier (M0) for demo |

- Custom `server.ts` for local development (single process)
- Split deployment for production: Vercel handles HTTP, separate service handles WebSockets
- `NEXT_PUBLIC_SOCKET_URL` points to the WS server URL in production

---

## 15. Milestones & Commit Strategy

Commits are made at each meaningful stage — not batched. Each phase produces multiple focused commits.

### Phase 1 — Foundation
- [ ] Project scaffolding (Next.js, Tailwind, shadcn/ui, deps) → **commit**
- [ ] MongoDB connection + Mongoose models with indexes → **commit**
- [ ] Zod validation schemas → **commit**
- [ ] JWT auth utilities + bcrypt → **commit**
- [ ] Auth API routes (register/login/me) → **commit**
- [ ] Global error handling middleware → **commit**

### Phase 2 — Core API
- [ ] Project CRUD API routes → **commit**
- [ ] Project member management routes → **commit**
- [ ] Task CRUD API routes → **commit**
- [ ] Task assignment endpoints → **commit**
- [ ] Comment endpoints → **commit**
- [ ] Cursor-based pagination → **commit**
- [ ] Full-text search endpoint → **commit**

### Phase 3 — Real-Time
- [ ] Custom server.ts (Express + Socket.io + Next.js) → **commit**
- [ ] Socket.io auth middleware + room management → **commit**
- [ ] Task change broadcasts → **commit**
- [ ] Presence detection → **commit**

### Phase 4 — Frontend (Auth & Layout)
- [ ] Root layout, providers, theme setup → **commit**
- [ ] Auth layout (split-screen) + login form → **commit**
- [ ] Register form + auth flow wiring → **commit**
- [ ] Dashboard layout (sidebar + top bar) → **commit**
- [ ] Theme toggle (dark/light) → **commit**

### Phase 5 — Frontend (Core Features)
- [ ] Project card grid page → **commit**
- [ ] Create project dialog → **commit**
- [ ] Kanban board with dnd-kit → **commit**
- [ ] Task card component → **commit**
- [ ] Task detail slide-over panel → **commit**
- [ ] Command palette (Cmd+K search) → **commit**

### Phase 6 — Frontend (Real-Time & Polish)
- [ ] Zustand stores + Socket.io client hooks → **commit**
- [ ] Real-time task updates on board → **commit**
- [ ] Toast notifications for remote changes → **commit**
- [ ] Presence avatars in top bar → **commit**
- [ ] Framer Motion animations (all from spec) → **commit**
- [ ] Loading skeletons + empty states → **commit**

### Phase 7 — Testing & Delivery
- [ ] Unit tests: cursor pagination logic → **commit**
- [ ] Unit tests: auth middleware → **commit**
- [ ] README with setup instructions & design decisions → **commit**
- [ ] Grant repo access to ranjith.madhavan@gmail.com
- [ ] Record 5-min demo video

---

## 16. Key Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Comments storage | Referenced (separate collection) | Avoids 16MB doc limit, enables independent pagination & search |
| Pagination | Cursor-based | Stable with real-time mutations, O(1) with index |
| API structure | Next.js API routes | Single deployment, shared types between frontend & backend |
| Socket.io integration | Custom `server.ts` wrapping Next.js | Required for persistent WebSocket connections |
| Validation | Zod | TypeScript-native, schema inference for types |
| Task status | 4-state enum | Maps to Kanban columns: Todo → In Progress → In Review → Done |
| UI library | shadcn/ui | Mature, 40+ components, copy-paste model for full control |
| Animations | Framer Motion | Best React animation lib, layout animations, spring physics |
| Drag & drop | dnd-kit | Modern, accessible, works well with Framer Motion |
| State management | Zustand | Lightweight, minimal boilerplate, ideal for real-time socket events |
| Color mode | Both (dark default) | Toggle with system preference detection, Linear-inspired dark theme |
| Task detail view | Slide-over panel | Board stays visible, smooth spring animation, no context loss |
| Search UX | Command palette (Cmd+K) | Fast keyboard access, searches across all entities |
| Presence UI | Avatar stack + green pulse dots | Familiar Figma-style, non-intrusive, expandable |
| RT update UX | Instant animation + toast | Cards move immediately, toast attributes the change to a user |
| Deployment | Vercel + separate WS server | Free Vercel hosting, dedicated WS process for Socket.io |
| Collaboration scope | Spec-only (no invites/roles) | Keeps scope tight for deadline |
