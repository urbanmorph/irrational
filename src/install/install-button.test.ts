import { describe, it, expect, vi } from "vitest";
import {
  isStandalone,
  isIosSafari,
  mountInstallButton,
  showIosGuide,
  type InstallWindow,
} from "./install-button";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1";
const IPAD_AS_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

function fakeWindow(
  opts: { ua?: string; touch?: number; standalone?: boolean } = {},
) {
  const target = new EventTarget();
  const win = Object.assign(target, {
    matchMedia: (q: string) => ({
      matches: q === "(display-mode: standalone)" && !!opts.standalone,
    }),
    navigator: {
      userAgent: opts.ua ?? DESKTOP_CHROME,
      maxTouchPoints: opts.touch ?? 0,
    },
    document: {} as Document,
  });
  return win as unknown as InstallWindow & EventTarget;
}

function fakeButton() {
  const el = new EventTarget() as EventTarget & { hidden: boolean };
  el.hidden = true;
  return el as unknown as HTMLButtonElement;
}

function fakePromptEvent(outcome: "accepted" | "dismissed") {
  const ev = new Event("beforeinstallprompt", { cancelable: true });
  return Object.assign(ev, {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome }),
  });
}

// A fake document whose <dialog> records what showIosGuide does to it.
function fakeDoc() {
  const dialog = Object.assign(new EventTarget(), {
    className: "",
    innerHTML: "",
    setAttribute: () => {},
    remove: () => {},
    showModal: vi.fn(),
  });
  const appended: unknown[] = [];
  const doc = {
    createElement: () => dialog,
    body: { appendChild: (el: unknown) => appended.push(el) },
  } as unknown as Document;
  return { doc, dialog, appended };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("isStandalone", () => {
  it("is true in display-mode standalone", () => {
    expect(isStandalone(fakeWindow({ standalone: true }))).toBe(true);
  });
  it("is true for iOS navigator.standalone", () => {
    const win = fakeWindow();
    (win.navigator as { standalone?: boolean }).standalone = true;
    expect(isStandalone(win)).toBe(true);
  });
  it("is false in a normal tab", () => {
    expect(isStandalone(fakeWindow())).toBe(false);
  });
});

describe("isIosSafari", () => {
  it("detects iPhone Safari", () => {
    expect(isIosSafari({ userAgent: IPHONE_SAFARI, maxTouchPoints: 5 })).toBe(
      true,
    );
  });
  it("detects iPadOS reporting as Mac with touch", () => {
    expect(isIosSafari({ userAgent: IPAD_AS_MAC, maxTouchPoints: 5 })).toBe(
      true,
    );
  });
  it("rejects desktop Mac Safari (no touch)", () => {
    expect(isIosSafari({ userAgent: IPAD_AS_MAC, maxTouchPoints: 0 })).toBe(
      false,
    );
  });
  it("rejects other-engine shells on iOS", () => {
    expect(isIosSafari({ userAgent: IPHONE_CHROME, maxTouchPoints: 5 })).toBe(
      false,
    );
  });
  it("rejects desktop Chrome", () => {
    expect(isIosSafari({ userAgent: DESKTOP_CHROME, maxTouchPoints: 0 })).toBe(
      false,
    );
  });
});

describe("mountInstallButton", () => {
  it("stays hidden when nothing offers install", () => {
    const button = fakeButton();
    mountInstallButton(button, { win: fakeWindow() });
    expect(button.hidden).toBe(true);
  });

  it("shows on beforeinstallprompt and prompts on click", async () => {
    const win = fakeWindow();
    const button = fakeButton();
    mountInstallButton(button, { win });
    const ev = fakePromptEvent("accepted");
    win.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(button.hidden).toBe(false);
    button.dispatchEvent(new Event("click"));
    await flush();
    expect(ev.prompt).toHaveBeenCalledOnce();
    expect(button.hidden).toBe(true);
  });

  it("stays visible if the prompt is dismissed", async () => {
    const win = fakeWindow();
    const button = fakeButton();
    mountInstallButton(button, { win });
    const ev = fakePromptEvent("dismissed");
    win.dispatchEvent(ev);
    button.dispatchEvent(new Event("click"));
    await flush();
    expect(ev.prompt).toHaveBeenCalledOnce();
    expect(button.hidden).toBe(false);
  });

  it("hides after appinstalled", () => {
    const win = fakeWindow();
    const button = fakeButton();
    mountInstallButton(button, { win });
    win.dispatchEvent(fakePromptEvent("accepted"));
    win.dispatchEvent(new Event("appinstalled"));
    expect(button.hidden).toBe(true);
  });

  it("never shows when already installed", () => {
    const win = fakeWindow({ standalone: true });
    const button = fakeButton();
    mountInstallButton(button, { win });
    win.dispatchEvent(fakePromptEvent("accepted"));
    expect(button.hidden).toBe(true);
  });

  it("shows on iOS Safari and opens the guide on click", () => {
    const win = fakeWindow({ ua: IPHONE_SAFARI, touch: 5 });
    const { doc, dialog, appended } = fakeDoc();
    win.document = doc;
    const button = fakeButton();
    mountInstallButton(button, { appName: "Irrational", win });
    expect(button.hidden).toBe(false);
    button.dispatchEvent(new Event("click"));
    expect(appended).toEqual([dialog]);
    expect(dialog.showModal).toHaveBeenCalledOnce();
  });

  it("stops listening after cleanup", () => {
    const win = fakeWindow();
    const button = fakeButton();
    const cleanup = mountInstallButton(button, { win });
    cleanup();
    win.dispatchEvent(fakePromptEvent("accepted"));
    expect(button.hidden).toBe(true);
  });
});

describe("showIosGuide", () => {
  it("escapes the app name", () => {
    const { doc, dialog: dlg } = fakeDoc();
    showIosGuide("<b>&x</b>", doc);
    expect(dlg.innerHTML).toContain("&lt;b&gt;&amp;x&lt;/b&gt;");
    expect(dlg.innerHTML).not.toContain("<b>");
  });
});
