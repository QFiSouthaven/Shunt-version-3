# Reusable Component Catalog
> **Developer Note:** Use these existing components instead of creating new ones whenever possible.

## Atoms

### `ShuntButton`
*   **Path:** `components/shunt/ShuntButton.tsx`
*   **Usage:** Primary action button for AI triggers. Supports drag-and-drop.
*   **Props:** `action`, `onClick`, `disabled`, `isActive`, `tooltip`, `icon`.

### `ToggleSwitch`
*   **Path:** `components/common/ToggleSwitch.tsx`
*   **Usage:** Boolean settings configuration.
*   **Props:** `id`, `label`, `checked`, `onChange`, `disabled`.

### `Loader`
*   **Path:** `components/Loader.tsx`
*   **Usage:** Spinner for async states.
*   **Props:** `className` (optional).

### `StatusIndicator`
*   **Path:** `components/common/StatusIndicator.tsx`
*   **Usage:** Visual dot for system status.
*   **Props:** `status` ('Running' | 'Stopped' | 'Pending' | 'Error').

## Molecules

### `OptimizedTextarea`
*   **Path:** `components/common/OptimizedTextarea.tsx`
*   **Usage:** High-performance text input with debouncing.
*   **Props:** `value`, `onChange`, `debounceMs`.

### `FileUpload`
*   **Path:** `components/common/FileUpload.tsx`
*   **Usage:** Drag-and-drop zone for file ingestion. Supports folders.
*   **Props:** `onFilesUploaded`, `acceptedFileTypes`, `maxFileSizeMB`, `enableDirectoryUpload`.

### `MarkdownRenderer`
*   **Path:** `components/common/MarkdownRenderer.tsx`
*   **Usage:** Safe rendering of AI markdown output. Supports Mermaid diagrams.
*   **Props:** `content`.

### `TabFooter`
*   **Path:** `components/common/TabFooter.tsx`
*   **Usage:** Standard footer showing user identity, shield status, and session ID.
*   **Props:** None (uses Context).

### `CommandPalette`
*   **Path:** `components/common/CommandPalette.tsx`
*   **Usage:** Global `Ctrl+K` navigation and action menu.
*   **Props:** `onNavigate`.

## Specialized Panels

### `TierCard`
*   **Path:** `components/subscription/TierCard.tsx`
*   **Usage:** Display subscription plan details.

### `UsageMeter`
*   **Path:** `components/subscription/UsageMeter.tsx`
*   **Usage:** Progress bar for quota tracking.

### `TerminalSession`
*   **Path:** `components/terminal/TerminalSession.tsx`
*   **Usage:** Mock command-line interface component.
