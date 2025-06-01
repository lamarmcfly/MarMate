# Frontend Application Structure – AI Assistant Platform  
Blueprint for a React + TypeScript implementation

---

## 1. Tech Stack Overview
| Concern | Choice | Rationale |
|---------|--------|-----------|
| Base framework | React 18  + Vite | Fast dev-server, modern build |
| Language | TypeScript | Type-safety across large codebase |
| Styling | Tailwind CSS + Headless UI | Utility–first, accessible components |
| State / Data | TanStack Query + Zustand | Query handles server cache; Zustand for ephemeral UI state |
| Forms | React Hook Form + Zod | Ergonomic validation with strong types |
| Routing | React Router v6 | Nested, lazy-loaded routes |
| Charts | Recharts | Simple, responsive data viz |
| Network | Axios | Interceptors for auth & error handling |
| Realtime | native WebSocket API (fallback to SSE) | Live conversation updates |
| Testing | Vitest + React Testing Library + Cypress | Unit, component & E2E |
| Lint / Format | ESLint, Prettier, Husky | Consistent code quality |
| i18n | react-i18next | Future localisation |
| A11y | eslint-plugin-jsx-a11y, Headless UI | WCAG 2.1 AA compliance goal |

---

## 2. High-Level Folder Layout
```
src/
├─ api/                # Axios instances & endpoint wrappers
│  ├─ client.ts
│  ├─ conversation.ts
│  └─ specification.ts
├─ app/                # Global providers & app shell
│  ├─ App.tsx
│  ├─ layout/
│  │   ├─ MainLayout.tsx
│  │   └─ Sidebar.tsx
│  └─ routes.tsx
├─ components/         # Reusable dumb components
│  ├─ ui/              # Buttons, modals, inputs …
│  ├─ charts/
│  └─ icons/
├─ features/           # Feature slices (smart components + hooks + state)
│  ├─ auth/
│  ├─ conversation/
│  ├─ specification/
│  ├─ workflow/
│  └─ debugging/
├─ hooks/              # Custom hooks (useMediaQuery, useDebounce…)
├─ stores/             # Zustand slices for cross-feature transient state
├─ contexts/           # React context (ThemeContext, WebSocketContext…)
├─ utils/              # Helpers, constants, type guards
├─ assets/
├─ pages/              # Route-level components
│  ├─ Home/
│  ├─ Conversation/
│  ├─ Specification/
│  └─ Settings/
├─ styles/             # Tailwind base + custom CSS vars
└─ tests/
    ├─ unit/
    ├─ integration/
    └─ e2e/
```

---

## 3. Core Components & Feature Modules

### 3.1 `conversation` Feature
| File | Responsibility |
|------|----------------|
| `ConversationPage.tsx` | Full chat UI incl. message list & input bar |
| `MessageBubble.tsx` | Render user/AI messages, markdown support |
| `ConversationService` | API calls to n8n endpoints `/specification/start`, `/specification/message` |
| `useConversation` | Hook orchestrating state, TanStack Query mutations & WebSocket events |
| Zustand slice | `conversationSlice.ts` to hold `currentConversation`, pending status etc. |

### 3.2 `specification` Feature
| File | Responsibility |
|------|----------------|
| `SpecificationPage.tsx` | Read-only view of generated spec |
| `ExecutiveSummary.tsx` | Section component |
| `RequirementsList.tsx` | Functional / NFR lists |
| `TechStackCard.tsx` | Tech stack grid |
| Charts for timeline | `MilestoneGantt.tsx` using Recharts |
| `specificationService.ts` | GET `/specification/:specId` |

### 3.3 Global UI
• `<MainLayout>`: Responsive drawer sidebar + header  
• `<Sidebar>`: Project overview, navigation links, collapsible on mobile  
• Theme switcher (dark/light – Tailwind classes)  
• `<NotificationsPopover>`: real-time alerts (Layer 3)  

---

## 4. State Management Strategy

1. **TanStack Query**
   • Handles server state (conversations, specs, tasks).  
   • Auto-refetch intervals + stale-while-revalidate.  
   • Global `QueryClient` configured with auth token interceptor.

2. **Zustand**
   • Lightweight store for UI state (sidebar open, theme).  
   • Compose middleware (persist, devtools).

3. **Context Providers**
   • `AuthProvider` supplies user + token.  
   • `WebSocketProvider` maintains single socket connection to n8n Webhook URL (e.g., `wss://api.domain.com/ws/:conversationId`).

---

## 5. API Integration with n8n

### 5.1 REST Endpoints
| Purpose | Method | Path |
|---------|--------|------|
| Start conversation | POST | `/specification/start` |
| Continue conversation | POST | `/specification/message` |
| Fetch spec | GET | `/specification/:specId` |

Axios instance in `api/client.ts`:
```ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20000,
});
api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 5.2 WebSocket / SSE
• After `start`, server returns `conversationId`.  
• Frontend opens socket `wss://api.domain.com/ws/conversationId`.  
• Events: `analysis_complete`, `question`, `spec_ready`.  
• Fallback: long-poll with TanStack Query `refetchInterval`.

---

## 6. Routing Plan (`app/routes.tsx`)
```
/
 ├─ /login
 ├─ /projects/:projectId
 │    ├─ /conversation            -> <ConversationPage/>
 │    └─ /spec                    -> <SpecificationPage/>
 ├─ /settings
 └─ *
```
Lazy-loaded route components using `React.lazy` + `Suspense`.

---

## 7. Responsive & Accessible Design

| Aspect | Practice |
|--------|----------|
| Mobile-first | CSS grid/flex layouts, Tailwind breakpoints (`sm/md/lg/xl`) |
| Keyboard nav | `tabIndex`, skip-links, focus rings via Tailwind `focus-visible` |
| Colour contrast | Tailwind theme uses WCAG-compliant palette; test with Storybook a11y add-on |
| Screen readers | `aria-live` for chat updates, semantic HTML (`<section>`, `<nav>`) |
| Motion | Respect `prefers-reduced-motion`; limit animations |
| Testing | Include axe-core checks in Vitest & Cypress pipelines |

---

## 8. Component Communication Diagram
```
ConversationPage
 ├─ MessageList
 │    ├─ MessageBubble*
 ├─ ChatInput
 │    └─ EmojiPicker
 └─ ConversationSidebar
      └─ ProjectInfoCard
```
*MessageBubble selects renderer: markdown, code block, images.

Data flows:  
`ChatInput` → mutation `sendMessage` (TanStack Query) → backend → WebSocket → `MessageList` updates via query invalidation.

---

## 9. Styling & Theming

1. Tailwind base layers in `styles/tailwind.css`.  
2. Custom colour tokens in `tailwind.config.js` tied to design system.  
3. Dark mode via class strategy (`class="dark"` on `<html>`).  
4. Use Headless UI for accessible primitives (Dialog, Menu, Listbox).

---

## 10. Testing Matrix

| Layer | Tool | What to test |
|-------|------|--------------|
| Unit | Vitest | utils, hooks |
| Component | React Testing Library | MessageBubble, Spec sections (snapshot + a11y) |
| API mocks | MSW | Query hooks behaviour |
| E2E | Cypress | Full conversation → spec flow on desktop & mobile |
| Visual | Storybook + Chromatic | Reusable components |

---

## 11. Dev & CI Guidelines

1. **Husky pre-commit** → lint, type-check, unit tests.  
2. **GitHub Actions** → build, Cypress run on PR.  
3. **Env vars** via `.env.*` (`VITE_API_BASE_URL`, `VITE_WS_URL`).  
4. **Bundle Analysis** with `rollup-plugin-visualizer`, goal `<250 kb` gzipped initial JS.

---

## 12. Future Enhancements

- PWA offline support for reading specs.  
- Drag-and-drop Gantt editing (Layer 3).  
- Live collaboration via CRDT (Yjs).  
- Internationalisation (i18n) beyond English.  
- Theming for medical vertical (align with USMLE brand palette).  

---

### End of Blueprint
