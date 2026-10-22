import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// Runs the real worker source in a sandbox: an in-memory Cache Storage, and a
// network the test switches on and off.
const SOURCE = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
const ORIGIN = "https://irrational.pages.dev";
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Fraunces";
const FONT_FILE = "https://fonts.gstatic.com/s/fraunces/v1/a.woff2";

const html = (body: string) =>
  new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
const css = (body: string) =>
  new Response(body, { headers: { "content-type": "text/css" } });

type Handler = (event: any) => void;

// In a worker, a relative URL resolves against the worker's origin.
class WorkerRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === "string" ? new URL(input, ORIGIN) : input, init);
  }
}

function makeWorker(version = "v1") {
  const stores = new Map<string, Map<string, Response>>();
  const keyOf = (r: Request | string) =>
    new URL(typeof r === "string" ? r : r.url, ORIGIN).href;
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      match: async (r: Request | string) => store.get(keyOf(r))?.clone(),
      put: async (r: Request | string, res: Response) =>
        void store.set(keyOf(r), res.clone()),
      delete: async (r: Request | string) => store.delete(keyOf(r)),
      keys: async () => [...store.keys()].map((u) => new Request(u)),
      addAll: async (rs: (Request | string)[]) => {
        for (const r of rs) {
          const res = await net(new Request(keyOf(r)));
          if (!res.ok) throw new TypeError(`addAll: ${res.status}`);
          store.set(keyOf(r), res);
        }
      },
    };
  };
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (r: Request | string, opts?: { cacheName?: string }) => {
      const names = opts?.cacheName ? [opts.cacheName] : [...stores.keys()];
      for (const n of names) {
        const hit = stores.get(n)?.get(keyOf(r));
        if (hit) return hit.clone();
      }
      return undefined;
    },
  };

  const site: Record<string, () => Response> = {
    "/": () => html(`home ${version}`),
    "/about/": () => html(`about ${version}`),
    "/offline/": () => html("offline page"),
    "/_astro/index.D_mT855W.css": () => css("body{}"),
    [FONT_CSS]: () => css("@font-face{}"),
    [FONT_FILE]: () =>
      new Response("font", { headers: { "content-type": "font/woff2" } }),
  };
  const state = { online: true, fetched: [] as string[] };
  async function net(req: Request): Promise<Response> {
    state.fetched.push(req.url);
    if (!state.online) throw new TypeError("Failed to fetch");
    const u = new URL(req.url);
    const page = site[u.origin === ORIGIN ? u.pathname : req.url];
    return page
      ? page()
      : new Response("not found", {
          status: 404,
          headers: { "content-type": "text/html" },
        });
  }

  const handlers: Record<string, Handler> = {};
  const self = {
    __PRECACHE__: {
      version,
      pages: ["/", "/about/", "/offline/"],
      assets: ["/_astro/index.D_mT855W.css"],
    },
    location: new URL(`${ORIGIN}/sw.js`),
    addEventListener: (type: string, fn: Handler) => (handlers[type] = fn),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
    registration: { navigationPreload: { enable: async () => {} } },
  };
  runInNewContext(SOURCE, {
    self,
    caches,
    fetch: net,
    Request: WorkerRequest,
    Response,
    URL,
    Promise,
    console,
  });

  async function lifecycle(type: "install" | "activate") {
    let done: Promise<unknown> = Promise.resolve();
    handlers[type]({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
  }
  /** Dispatches a fetch; resolves to the response, or null if the worker let it through. */
  async function request(
    url: string,
    init: RequestInit & { mode?: string } = {},
  ): Promise<Response | null> {
    // Only a browser can make a navigate request, so the mode is set after.
    const { mode, ...rest } = init;
    const req = new Request(new URL(url, ORIGIN), rest);
    if (mode) Object.defineProperty(req, "mode", { value: mode });
    const event = { responded: null as Promise<Response> | null };
    const waits: Promise<unknown>[] = [];
    handlers.fetch({
      request: req,
      preloadResponse: Promise.resolve(undefined),
      respondWith: (p: Promise<Response>) => (event.responded = p),
      waitUntil: (p: Promise<unknown>) => waits.push(p),
    });
    const res = event.responded ? await event.responded : null;
    await Promise.all(waits);
    return res;
  }
  return { state, stores, lifecycle, request };
}

const page = (w: ReturnType<typeof makeWorker>, path: string) =>
  w.request(path, { mode: "navigate" });

describe("offline worker", () => {
  let w: ReturnType<typeof makeWorker>;
  beforeEach(async () => {
    w = makeWorker();
    await w.lifecycle("install");
    await w.lifecycle("activate");
  });

  it("saves every page and build file on install", async () => {
    w.state.online = false;
    expect(await (await page(w, "/about/"))!.text()).toBe("about v1");
    expect(await (await w.request("/_astro/index.D_mT855W.css"))!.text()).toBe(
      "body{}",
    );
  });

  it("serves pages from the network when online, so a new deploy shows at once", async () => {
    const next = makeWorker("v2");
    await next.lifecycle("install");
    expect(await (await page(next, "/"))!.text()).toBe("home v2");
    expect(next.state.fetched.at(-1)).toBe(`${ORIGIN}/`);
  });

  it("offline, serves the saved page, with or without the trailing slash or a query", async () => {
    w.state.online = false;
    expect(await (await page(w, "/about"))!.text()).toBe("about v1");
    expect(await (await page(w, "/about/?ref=x"))!.text()).toBe("about v1");
  });

  it("offline, shows the offline page for a page that isn't saved", async () => {
    w.state.online = false;
    const res = (await page(w, "/not-saved/"))!;
    expect(await res.text()).toBe("offline page");
    expect(res.status).toBe(503);
  });

  it("serves a hashed build file from the cache, and refetches a copy of the wrong type", async () => {
    w.state.fetched = [];
    await w.request("/_astro/index.D_mT855W.css");
    expect(w.state.fetched).toEqual([]);
    const assets = w.stores.get("assets")!;
    assets.set(`${ORIGIN}/_astro/index.D_mT855W.css`, html("<!doctype html>"));
    const res = (await w.request("/_astro/index.D_mT855W.css"))!;
    expect(await res.text()).toBe("body{}");
  });

  it("caches the web fonts as they load, so they work offline later", async () => {
    await w.request(FONT_CSS);
    await w.request(FONT_FILE);
    w.state.online = false;
    expect(await (await w.request(FONT_CSS))!.text()).toBe("@font-face{}");
    expect(await (await w.request(FONT_FILE))!.text()).toBe("font");
  });

  it("leaves the MCP endpoint, POSTs and other sites to the network", async () => {
    expect(await w.request("/mcp/server")).toBeNull();
    expect(
      await w.request("/mcp/server", { method: "POST", body: "{}" }),
    ).toBeNull();
    // A form posted as a page load: never answered, or saved, as that page.
    expect(
      await w.request("/about/", {
        method: "POST",
        body: "x",
        mode: "navigate",
      }),
    ).toBeNull();
    expect(
      await w.request("https://static.cloudflareinsights.com/beacon.min.js"),
    ).toBeNull();
  });

  it("on update, drops the old version's pages and unused build files", async () => {
    w.stores
      .get("assets")!
      .set(`${ORIGIN}/_astro/old.AbCdEfGh.css`, css("old"));
    const next = makeWorker("v2");
    // Same storage: the new worker sees the old caches.
    for (const [name, store] of w.stores) next.stores.set(name, store);
    await next.lifecycle("install");
    await next.lifecycle("activate");
    expect(
      [...next.stores.keys()].filter((k) => k.startsWith("pages-")),
    ).toEqual(["pages-v2"]);
    expect([...next.stores.get("assets")!.keys()]).toEqual([
      `${ORIGIN}/_astro/index.D_mT855W.css`,
    ]);
  });
});
