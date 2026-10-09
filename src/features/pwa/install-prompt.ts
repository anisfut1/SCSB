import { useSyncExternalStore } from "react";

/**
 * Invite d'installation native (Chrome/Edge/Samsung sur Android, Chrome desktop).
 * `beforeinstallprompt` ne part qu'une fois, souvent AVANT le montage des
 * composants : l'écoute est installée une seule fois (PwaRegister) et
 * l'événement conservé ici.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function listenForInstallPrompt(): () => void {
  const onPrompt = (event: Event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  };
  const onInstalled = () => {
    deferred = null;
    installed = true;
    emit();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const event = deferred;
  deferred = null;
  emit();
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") installed = true;
  emit();
  return outcome;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useNativeInstall(): { canPrompt: boolean; installed: boolean } {
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const done = useSyncExternalStore(subscribe, () => installed, () => false);
  return { canPrompt, installed: done };
}
