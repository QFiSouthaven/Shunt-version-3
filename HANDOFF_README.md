# 🚨 CRISIS HANDOFF PACKAGE: Aether Shunt OS (v3.0.0)

**Date:** [Current Date]
**Deadline:** TOMORROW
**Status:** ALPHA / FUNCTIONAL

---

## 1. Executive Summary (Read Me First)
**Current Status:**
The application is **Code Complete** for the Core Workspace modules (Shunt, Weaver, Chat). The Laboratory modules (Foundry, Oraculum) are functional but experimental.

**The "Happy Path" (What definitely works):**
1.  **Launch:** App loads successfully via `npm run dev`.
2.  **Auth:** User can click "Connect" (Simulated OAuth) to enter the Mission Control.
3.  **Shunt:** Text input -> Select Action (e.g., Summarize) -> Gemini API Call -> Output rendering works.
4.  **Persistence:** History and settings persist via IndexedDB after refresh.

**Definition of Done (For Tomorrow):**
*   [x] UI/UX Polish ("Obsidian Glass" theme applied).
*   [x] Gemini API Integration (v3 Pro/Flash models wired up).
*   [x] Local LLM Fallback (Settings configuration UI exists).
*   [ ] Real-time Collaboration (Out of scope).
*   [ ] Production Backend (Using Mock Service Workers / Client-side logic).

---

## 2. The "Red Button" Deployment Guide
*How to turn it on without thinking.*

### Prerequisites
*   Node.js v18+
*   A valid Google Gemini API Key

### Step-by-Step
1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Create a `.env` file in the root:
    ```env
    API_KEY=your_actual_gemini_api_key_here
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    *Access at:* `http://localhost:3000`

4.  **Production Build (Optional):**
    ```bash
    npm run build
    npm run preview
    ```

---

## 3. Access & Credentials Matrix

| Service | Access Level | Credentials / Notes |
| :--- | :--- | :--- |
| **App Login** | Simulated | Click "GitHub" or "Google" on Settings page. (Mock Auth) |
| **Gemini API** | Admin | Provided in `.env`. Key must have `generative-language` scope. |
| **Local LLM** | User Managed | Requires LM Studio running on port `1234` or Ollama on `11434`. |
| **Telemetry** | Internal | No login required. Data is stored in-browser (IndexedDB). |

---

## 4. The "Snag List" (Known Issues & Workarounds)

**⚠️ Critical Warnings:**
1.  **API Rate Limits:** If the Shunt button spins forever, you likely hit the Gemini Flash rate limit.
    *   *Workaround:* Wait 60 seconds or switch model to `gemini-3-pro` in the Control Panel.
2.  **Storage Quota:** Large file uploads (Foundry module) may hit browser storage limits.
    *   *Workaround:* Use the "Clear Storage" button in Settings if the app feels sluggish.

**🚧 Feature Flags / Disabled Modules:**
*   **Orchestrator:** Currently shows "System Locked" screen. This is intentional.
*   **UI Builder:** Currently shows "System Locked" screen.
*   **Developers Module:** Experimental graph view.

**Performance Constraints:**
*   **Chat:** Long conversations (>50 messages) may lag slightly due to re-rendering markdown.
*   **Mobile:** Sidebar navigation is replaced by a bottom bar; some complex tables (Chronicle) require horizontal scrolling.

---

## 5. Video Walkthroughs (The "Loom" Strategy)
*Record these screens if explaining is too slow.*

1.  **The 2-Minute Tour:** [Insert Link Here] - *Shows Shunt -> Weaver -> Chat flow.*
2.  **Configuration Demo:** [Insert Link Here] - *Shows how to set the API key and switch to Local LLM.*

---

## 6. The "Post-Launch" IOU
*What we are doing next week.*

*   **Refactor:** Move `geminiService.ts` to a proper backend proxy to hide API keys.
*   **Feature:** Unlock the Orchestrator node editor.
*   **Cleanup:** Remove mock data from `toolApi.ts` and implement real File System Access API.
*   **Support:** Emergency triage available via `security@aether-shunt-project.dev`.

