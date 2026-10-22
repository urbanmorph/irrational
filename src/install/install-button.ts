// "Install app" button logic, ported from the shared install-button component.
//
// Behaviour by platform:
//   Chrome / Edge / Samsung Internet / Android -> real install: the browser fires
//       `beforeinstallprompt`; we keep it and call prompt() on tap.
//   iPhone / iPad Safari -> no install API exists; the button opens a short
//       "Share -> Add to Home Screen" guide instead.
//   Already installed (running standalone) -> hidden.
//   Anything else (e.g. Firefox desktop) -> hidden.
// Needs a valid web app manifest, otherwise `beforeinstallprompt` never fires.

interface InstallNavigator {
  userAgent?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
}

export interface InstallWindow {
  matchMedia?: (query: string) => { matches: boolean };
  navigator: InstallNavigator;
  document: Document;
  addEventListener: Window["addEventListener"];
  removeEventListener: Window["removeEventListener"];
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isStandalone(win: InstallWindow = window): boolean {
  return (
    win.matchMedia?.("(display-mode: standalone)").matches === true ||
    win.navigator.standalone === true
  );
}

// iPadOS 13+ reports itself as Mac; tell it apart by touch support.
export function isIosSafari(nav: InstallNavigator = navigator): boolean {
  const ua = nav.userAgent || "";
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1);
  // These can't add to home screen the same way.
  const otherEngineShell = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return ios && !otherEngineShell;
}

export function mountInstallButton(
  button: HTMLButtonElement | null,
  {
    appName = "this app",
    win = window,
  }: { appName?: string; win?: InstallWindow } = {},
): () => void {
  if (!button || isStandalone(win)) return () => {};
  let deferred: BeforeInstallPromptEvent | null = null;

  const onPrompt = (e: Event) => {
    e.preventDefault(); // keep the browser's mini-infobar away; we offer the button instead
    deferred = e as BeforeInstallPromptEvent;
    button.hidden = false;
  };
  const onInstalled = () => {
    deferred = null;
    button.hidden = true;
  };
  win.addEventListener("beforeinstallprompt", onPrompt);
  win.addEventListener("appinstalled", onInstalled);

  if (isIosSafari(win.navigator)) button.hidden = false;

  button.addEventListener("click", async () => {
    if (deferred) {
      const ev = deferred;
      deferred = null;
      ev.prompt();
      const { outcome } = await ev.userChoice;
      if (outcome === "accepted") button.hidden = true;
      return;
    }
    if (isIosSafari(win.navigator)) showIosGuide(appName, win.document);
  });

  return () => {
    win.removeEventListener("beforeinstallprompt", onPrompt);
    win.removeEventListener("appinstalled", onInstalled);
  };
}

// A minimal accessible dialog, styled by the .install-guide rules in global.css.
export function showIosGuide(appName: string, doc: Document = document): void {
  const dlg = doc.createElement("dialog");
  dlg.className = "install-guide";
  dlg.setAttribute("aria-labelledby", "install-guide-title");
  dlg.innerHTML = `
    <h2 id="install-guide-title">Add ${escapeHtml(appName)} to your Home Screen</h2>
    <ol>
      <li>Tap the <strong>Share</strong> button <span aria-hidden="true">(the square with an arrow)</span> in Safari's toolbar.</li>
      <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
      <li>Tap <strong>Add</strong>.</li>
    </ol>
    <form method="dialog"><button>OK</button></form>`;
  dlg.addEventListener("close", () => dlg.remove());
  doc.body.appendChild(dlg);
  dlg.showModal();
}

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}
