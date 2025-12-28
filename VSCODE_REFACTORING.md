# Frontend Refactoring Scope & Performance Optimization Plan

## Additional Context
This document outlines the scope for reducing latencies in frontend loading times. The analysis identifies key bottlenecks in the current `Next.js 16` + `React 19` application and proposes specific refactoring steps.

## 1. Architecture & Rendering Strategy

### Current State
- **Client-Side Heavy**: Key pages like `app/stocks/page.tsx` and `app/portfolio/page.tsx` are marked as `"use client"`. They render a loading spinner while fetching data on the client side. This causes:
    - **Waterfalls**: The browser downloads JS -> Executes JS -> Fires Fetch -> Waits -> Renders content.
    - **Layout Shift**: Loading spinners replaced by content.
    - **SEO Impact**: Search engines see loading states instead of content.

### Proposed Refactoring
- **Adopt Server Components (RSC)**: Convert `StockListPage` and `PortfolioPage` to Server Components.
    - **Action**: Fetch initial data (first page of stocks) on the server.
    - **Benefit**: Browser receives fully populated HTML. Data fetch happens on the server (low latency to DB/Backend). Zero client-side waterfalls for initial content.
- **Streaming & Suspense**: Wrap heavy components (like the Stock Table) in `<Suspense>` with a Skeleton fallback. This allows the shell to load instantly while data streams in.

## 2. Data Fetching & State Management

### Current State
- **Manual Fetching**: `useEffect` and `fetch` are used manually in `app/stocks/page.tsx`.
    - **No Caching**: Navigating away and back triggers a full re-fetch.
    - **No Prefetching**: Pagination waits for the user to click "Next" before fetching.
    - **Race Conditions**: Manual handling of strict mode double-invocations and potential race conditions.
- **Auth Blocking**: `AuthContext` waits for `/auth/me` network call to complete before checking `isAuthenticated`. This delays the *entire* application render for logged-in users.

### Proposed Refactoring
- **Integrate TanStack Query (React Query)**:
    - **Action**: Replace `api.ts` manual calls with custom hooks (e.g., `useStocks`, `usePortfolio`).
    - **Benefit**:
        - **Caching**: Instant load when navigating back to lists.
        - **Prefetching**: Prefetch the next page of stocks while the user views the current one -> "Zero latency" pagination.
        - **Optimistic Updates**: Toggle stock portfolio status instantly in UI while syncing with server in background.
- **Optimize Auth Flow**:
    - **Action**: Use middleware for route protection (redirecting if no token) rather than client-side blocking.
    - **Action**: Allow public parts of the app to render immediately while validating session in background.

## 3. Bundle Size & Code Splitting

### Current State
- **Global Chat Bundle**: `ChatAssistant` is imported in `layout.tsx`. It imports `ChatInterface`, which likely imports Markdown renderers and other UI logic.
    - **Impact**: This heavy code is downloaded/parsed on *every* page load, even if the user never opens the chat.

### Proposed Refactoring
- **Lazy Loading**:
    - **Action**: Use `next/dynamic` to lazy load the `ChatInterface` component.
    - **Code**: `const ChatInterface = dynamic(() => import('./ChatInterface'), { ssr: false });`
    - **Benefit**: The heavy chat code is only downloaded when the user actually clicks the chat button.

## 4. Specific Component Optimizations

### Stock List (`app/stocks/page.tsx`)
- **Virtualization**: If the list grows beyond 50-100 items, use `react-window` or `tanstack/virtual` to render only visible rows.
- **Optimistic Portfolio Toggle**: Currently, adding a stock to the portfolio shows a spinner. It should be instant.

### Dashboard (`app/dashboard/page.tsx`)
- **Static vs Dynamic**: Ensure dashboard cards are static if they don't depend on user data, or use Server Components to fetch personalized data (e.g., "5 stocks in your portfolio").

## Summary of Priority
1.  **Lazy Load Chat**: Low effort, high impact on initial bundle size.
2.  **React Query**: Medium effort, massive impact on perceived speed (caching/prefetching).
3.  **Server Components**: Medium/High effort, best for FCP (First Contentful Paint) and SEO.

## 5. Repo-wide Scan Findings

The quick workspace scan surfaced several cross-cutting hotspots and opportunities to apply the refactor guidance above.

- **Chat bundle is global:** `ChatAssistant` (imported in `layout.tsx`) directly imports `ChatInterface` which pulls in heavy UI and effectful code. This causes the chat code to be downloaded on every page even when unused.
- **Many client-only boundaries:** Several pages and components use `"use client"` (examples: `app/login/page.tsx`, `app/signup/page.tsx`, `components/Header.tsx`), suggesting the app renders a large portion on the client unnecessarily.
- **Auth blocks rendering:** `contexts/AuthContext.tsx` is used widely (header and client pages) and currently waits for `/auth/me` — this can block initial render for logged-in users and increase FCP.
- **Manual fetches across frontend:** `api.ts` contains direct `fetch()` calls for listing stocks, details and portfolio actions. These are ideal candidates for TanStack Query hooks (`useStocks`, `usePortfolio`).
- **Backend surface to audit:** The `backend/` folder contains many endpoints (e.g., `backend/ai_api.py`) that should be profiled and consolidated where possible — reducing backend latency will multiply frontend improvements.
- **Deps & bundling:** `frontend/package.json` exists; confirm whether heavy deps (markdown renderers, LLM UI libs) are loaded in `ChatInterface` and split accordingly.

### Immediate next steps (fast wins)

- Lazy-load `ChatInterface` using `next/dynamic` with `{ ssr: false }` so chat code is fetched only when needed.
- Add a `QueryClient` provider to the root layout and scaffold `useStocks` with `useQuery` + `queryClient.prefetchQuery` for next-page prefetching.
- Convert `app/stocks/page.tsx` to a Server Component that fetches the first page server-side and streams client interactivity with client-bound subcomponents.
- Replace the blocking client-side auth check with middleware for protected routes and allow the public shell to render while session validation happens in background.
- Profile slow backend endpoints (start with `ai_api.py`, portfolio and stocks endpoints) and add caching where sensible.

These findings were added as a concise appendix so the doc maps directly to concrete repo hotspots and next PRs.
