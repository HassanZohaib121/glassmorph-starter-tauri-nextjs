"use client";

import { Copy, Minus, Moon, Square, Sun, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TauriWindow = typeof import("@tauri-apps/api/window") extends {
  getCurrentWindow: () => infer T;
}
  ? T
  : never;

export default function Titlebar() {
  const [appWindow, setAppWindow] = useState<TauriWindow | null>(null);
  const [maximized, setMaximized] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("fluxtransfer-theme");
    const initialTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("fluxtransfer-theme", nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | undefined;

    async function initialize() {
      if (!("__TAURI_INTERNALS__" in window)) return;

      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const currentWindow = getCurrentWindow();

        if (!mounted) return;

        setAppWindow(currentWindow);
        setMaximized(await currentWindow.isMaximized());

        unlisten = await currentWindow.onResized(async () => {
          if (mounted) {
            setMaximized(await currentWindow.isMaximized());
          }
        });
      } catch (error) {
        console.error("Window initialization failed:", error);
      }
    }

    initialize();

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  const windowAction = async (action: "minimize" | "maximize" | "close") => {
    if (!appWindow) return;

    try {
      if (action === "minimize") {
        await appWindow.minimize();
      }

      if (action === "maximize") {
        await appWindow.toggleMaximize();
        setMaximized(await appWindow.isMaximized());
      }

      if (action === "close") {
        await appWindow.close();
      }
    } catch (error) {
      console.error(`Window ${action} failed:`, error);
    }
  };

  return (
    <header
      className="
          relative z-50 flex h-14 w-full shrink-0
          select-none items-center justify-between
          overflow-hidden
          border-b border-slate-400/20 dark:border-white/[0.07]
          bg-transparent
          text-foreground
          shadow-sm
          backdrop-blur-2xl
          supports-backdrop-filter:bg-transparent/55
        "
    >
      {/* Glass highlight */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-cyan-400/[0.035] via-transparent to-violet-400/[0.035]" />

      {/* Top glass reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

      {/* BRAND */}
      <div
        data-tauri-drag-region
        className="relative flex h-full min-w-0 flex-1 items-center gap-3 px-5"
      >
        <div data-tauri-drag-region className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Dumper Logo"
            loading="eager"
            width={1195}
            height={740}
            style={{ width: 70, height: "auto" }}
            className="dark:invert"
          />
          <span className="text-[23px] font-extrabold tracking-[-1.2px] dark:text-white text-slate-950">
            Dumper<span className="text-primary">.</span>
          </span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative flex h-full shrink-0 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              onClick={toggleTheme}
              className="mr-2 size-9 rounded-lg text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun size={15} strokeWidth={1.7} />
              ) : (
                <Moon size={15} strokeWidth={1.7} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="mr-2 h-5 w-px bg-border/70" />

        {/* WINDOW CONTROLS */}
        <div className="flex h-full items-center gap-0.5 px-2">
          {/* Minimize */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!appWindow}
                onClick={() => windowAction("minimize")}
                className="
                    size-9 rounded-lg
                    text-muted-foreground
                    hover:bg-white/8
                    hover:text-foreground
                    transition-colors
                  "
              >
                <Minus size={15} strokeWidth={1.7} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Minimize</TooltipContent>
          </Tooltip>

          {/* Maximize / Restore */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!appWindow}
                onClick={() => windowAction("maximize")}
                className="
                    size-9 rounded-lg
                    text-muted-foreground
                    hover:bg-white/8
                    hover:text-foreground
                    transition-colors
                  "
              >
                {maximized ? (
                  <Copy size={12} strokeWidth={1.7} />
                ) : (
                  <Square size={12} strokeWidth={1.7} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {maximized ? "Restore" : "Maximize"}
            </TooltipContent>
          </Tooltip>

          {/* Close */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!appWindow}
                onClick={() => windowAction("close")}
                className="
                    size-9 rounded-lg
                    text-muted-foreground
                    hover:bg-red-500
                    hover:text-white
                    transition-colors
                  "
              >
                <X size={15} strokeWidth={1.7} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close application</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
