// import { useTranslations } from 'next-intl';
import { useEffect } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// TODO: Implement this hook properly if we have any other option like router events
// or interceptors

const clickType = typeof document !== "undefined" && document.ontouchstart ? "touchstart" : "click";

interface GuardEventListener {
  onBeforeUnload: () => boolean;
}

export function usePageUnloadGuard() {
  const router = useRouter();

  // const t = useTranslations('studio');
  const pathname = usePathname();
  const searchParams: any = useSearchParams();

  const listener: GuardEventListener = {
    onBeforeUnload: () => false,
  };

  const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    listener.onBeforeUnload() && event.preventDefault();
  };

  const clickHandler = (event: MouseEvent | TouchEvent) => {
    if ((event as MouseEvent).button || event.which !== 1) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target as HTMLElement;
    if (target.tagName !== "A") {
      return;
    }

    const newPath = target.getAttribute("href");
    if (newPath && newPath !== window.location.pathname && listener.onBeforeUnload()) {
      event.preventDefault();
      // NOTE: There is an option to show standard beforeunload dialog here by
      // actually assigning window.location.href to newPath. That will be more
      // consistent, but will cause full page reload in case of the user decides to
      // go back.
      // window.location.href = newPath; // This will show the standard dialog
      // if (confirm("unsaved title!")) {
      //     router.push(newPath);
      // }

      router.push(newPath);

      //publish event
    }
  };

  const popStateHandler = (event: PopStateEvent) => {
    if (event.state !== null) {
      return;
    }

    // if (listener.onBeforeUnload() && confirm(t('dialogs.unsaved.title'))) {
    // if (listener.onBeforeUnload() && confirm("unsaved!")) {
    if (listener.onBeforeUnload()) {
      window.removeEventListener("popstate", popStateHandler);
      history.back();
      return;
    }
    // Returning to the fake history state
    history.go(1);
  };

  useEffect(() => {
    // Since 'popstate' fires at the end of the page swap, there is no option to
    // cancel it. So we're adding artificial state and in case we got there,
    // it means a user pressed back button.
    // TODO: Check if it is safe to add these to deps so the effect will re-run with pathname and params change
    history.pushState(null, "", pathname + searchParams.toString());
    window.addEventListener("beforeunload", beforeUnloadHandler);
    window.addEventListener("popstate", popStateHandler);
    window.document.addEventListener(clickType, clickHandler, {
      capture: true,
    });
    const onload = () => {
      window.removeEventListener("load", onload);
    };

    window.addEventListener("load", onload);
    return () => {
      window.removeEventListener("popstate", popStateHandler);
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      window.document.removeEventListener(clickType, clickHandler, {
        capture: true,
      });
    };
  });

  return listener;
}

export default usePageUnloadGuard;
