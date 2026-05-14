import { useEffect, useRef } from "react";

interface GiscusProps {
  term?: string;
}

export function Giscus({ term }: GiscusProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Clear (e.g. on slug change) so giscus re-mounts cleanly
    ref.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", "terryso/terryso.github.com");
    script.setAttribute("data-repo-id", "MDEwOlJlcG9zaXRvcnk3MzIyOTY3");
    script.setAttribute("data-category", "Announcements");
    script.setAttribute("data-category-id", "DIC_kwDOAG-9V84CtT80");
    script.setAttribute("data-mapping", term ? "specific" : "pathname");
    if (term) script.setAttribute("data-term", term);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "dark_dimmed");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");

    ref.current.appendChild(script);
  }, [term]);

  return <div ref={ref} className="giscus mt-4" />;
}
