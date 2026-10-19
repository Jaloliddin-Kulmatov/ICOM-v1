// The left sidebar shows on every page on computers (md and up), except the
// landing page and sign-in flows. Collapsing it is remembered in this browser.
// <html data-has-sidebar="1|0" data-sidebar="open|collapsed"> drives the page
// padding in globals.css; layout.tsx sets both before first paint.
export const SIDEBAR_KEY = "icom_sidebar";
export const NO_SIDEBAR = /^\/(login|register|forgot-password|onboarding)(\/|$)/;

export function sidebarShownOn(pathname: string) {
  return pathname !== "/" && !NO_SIDEBAR.test(pathname);
}

/** Inline script for <head>: set the attributes before the page paints. */
export const SIDEBAR_BOOT_SCRIPT = `try{var p=location.pathname,d=document.documentElement;d.dataset.hasSidebar=(p!=="/"&&!${NO_SIDEBAR}.test(p))?"1":"0";d.dataset.sidebar=localStorage.getItem("${SIDEBAR_KEY}")==="collapsed"?"collapsed":"open"}catch(e){}`;
