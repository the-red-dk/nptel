"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const element = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;

  useEffect(() => {
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!sitekey || !element.current) return;
    let widgetId: string | undefined;
    const render = () => {
      if (!widgetId && window.turnstile && element.current) widgetId = window.turnstile.render(element.current, {
        sitekey, action: "nptelboard-submit",
        callback: (token) => callback.current(token),
        "expired-callback": () => callback.current(""),
        "error-callback": () => callback.current(""),
      });
    };
    let script = document.querySelector<HTMLScriptElement>("#turnstile-api");
    if (!script) {
      script = document.createElement("script");
      script.id = "turnstile-api";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }
    script.addEventListener("load", render);
    render();
    return () => { script?.removeEventListener("load", render); if (widgetId) window.turnstile?.remove(widgetId); };
  }, []);

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null;
  return <div ref={element} aria-label="Bot protection check" />;
}
