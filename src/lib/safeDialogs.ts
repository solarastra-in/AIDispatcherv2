/**
 * src/lib/safeDialogs.ts
 *
 * The specific bug named in the request — "the confirm() sandboxing
 * error" — happens in event handlers (a button's onClick calling
 * window.confirm() directly), NOT during render. A React ErrorBoundary
 * explicitly does NOT catch errors thrown in event handlers.
 *
 * WHY THIS HAPPENS: browsers (and some embedding contexts, e.g. an
 * iframe with the `allow-modals` sandbox flag omitted) block
 * window.confirm/alert/prompt and throw
 * "Failed to execute 'confirm' on 'Window': Sandboxed document..."
 * instead of silently no-op'ing.
 */

/**
 * Drop-in replacement for `window.confirm()`. On a genuine user
 * decision, returns their real answer. If the browser throws (sandboxed
 * context), falls back to `fallbackValue` — and logs loudly so this
 * silent-seeming fallback is actually visible in your error tracking,
 * not a mystery later.
 */
export function safeConfirm(message: string, fallbackValue: boolean = false): boolean {
  try {
    return window.confirm(message);
  } catch (err: any) {
    console.error(`[safeConfirm] window.confirm() threw (likely a sandboxed context) — falling back to ${fallbackValue}. Message was: "${message}"`, err);
    return fallbackValue;
  }
}

export function safeAlert(message: string): void {
  try {
    window.alert(message);
  } catch (err: any) {
    console.error(`[safeAlert] window.alert() threw (likely a sandboxed context) — the user never saw this message: "${message}"`, err);
  }
}

export function safePrompt(message: string, defaultValue: string = ""): string | null {
  try {
    return window.prompt(message, defaultValue);
  } catch (err: any) {
    console.error(`[safePrompt] window.prompt() threw (likely a sandboxed context) — returning null. Message was: "${message}"`, err);
    return null;
  }
}
