import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useGetLink, useLinks } from "@linkwarden/router/links";
import { PreservationContent } from "./PreservationContent";
import PreservationNavbar from "./PreservationNavbar";
import { ArchivedFormat } from "@linkwarden/types";

export default function PreservationPageContent() {
  const router = useRouter();
  const { links } = useLinks();

  const [showNavbar, setShowNavbar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  let isPublicRoute = router.pathname.startsWith("/public") ? true : undefined;

  const { data: link, refetch } = useGetLink({
    id: Number(router.query.id),
    isPublicRoute,
    enabled: true,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      link &&
      (!link?.image || !link?.pdf || !link?.readable || !link?.monolith)
    ) {
      interval = setInterval(() => {
        refetch().catch((error) => {
          console.error("Error refetching link:", error);
        });
      }, 5000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [links]);

  const progressUpdateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Helper to generate a text anchor
  const getTextAnchor = (container: HTMLElement, el: Element) => {
    const text = el.textContent?.trim().slice(0, 100); // First 100 chars
    if (!text) return null;

    // Find all elements with this text to determine instance index
    // We limit the search to direct children or significant blocks to avoid noise
    const allWithText = Array.from(
      container.querySelectorAll("#readable-view > *")
    ).filter((e) => e.textContent?.trim().startsWith(text));
    const instance = allWithText.indexOf(el);

    return { text, instance: instance === -1 ? 0 : instance };
  };

  const getFirstVisibleElement = (container: HTMLElement) => {
    const containerRect = container.getBoundingClientRect();
    // Check the center of the container, slightly offset from the top
    const x = containerRect.left + containerRect.width / 2;
    const y = containerRect.top + 100; // 100px from top to avoid navbar/padding

    let el = document.elementFromPoint(x, y);
    
    // Traverse up to find a meaningful block element inside our view
    while (el && container.contains(el) && el !== container) {
      const tag = el.tagName.toLowerCase();
      // If it's a meaningful text block, return it
      if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "pre"].includes(tag)) {
        return el;
      }
      el = el.parentElement;
    }
    
    // Fallback: if no specific block found, try the original loop but stricter
    return null;
  };

  useEffect(() => {
    if (!link?.id) return;

    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/v1/reading-progress?linkId=${link.id}`);
        if (res.ok) {
          const data = await res.json();
          const response = data.response;

          if (response) {
            const container = scrollRef.current;
            if (!container) return;

            const attemptScroll = (retries = 0) => {
              if (retries > 20) return;

              // Try text position first
              if (response.textPosition) {
                const { text, instance } = response.textPosition;
                if (text) {
                  const allWithText = Array.from(
                    container.querySelectorAll("#readable-view > *")
                  ).filter((e) => e.textContent?.trim().startsWith(text));

                  const el = allWithText[instance || 0];
                  if (el) {
                    el.scrollIntoView({ block: "start" });
                    return;
                  }
                }
              }

              // Fallback to percent
              if (
                response.percent > 0 &&
                container.scrollHeight > container.clientHeight
              ) {
                const scrollTop =
                  (container.scrollHeight - container.clientHeight) *
                  (response.percent / 100);
                container.scrollTo({ top: scrollTop, behavior: "smooth" });
              } else {
                setTimeout(() => attemptScroll(retries + 1), 500);
              }
            };

            attemptScroll();
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchProgress();
  }, [link?.id]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const st = container.scrollTop;
      // if scrolling down and beyond a small threshold, hide
      if (st - 10 > lastScrollTop.current) {
        if (Number(router.query.format) === ArchivedFormat.readability)
          setShowNavbar(false);
      }
      // if scrolling up, show
      else if (st < lastScrollTop.current - 10) {
        setShowNavbar(true);
      }
      lastScrollTop.current = st <= 0 ? 0 : st; // for Mobile or negative

      // Update reading progress
      if (link?.id) {
        const height = container.scrollHeight - container.clientHeight;
        if (height > 0) {
          const percent = (st / height) * 100;

          // Find anchor
          const anchorEl = getFirstVisibleElement(container);
          const textPosition = anchorEl
            ? getTextAnchor(container, anchorEl)
            : null;

          // Debounce updates
          if (progressUpdateTimeout.current) {
            clearTimeout(progressUpdateTimeout.current);
          }

          progressUpdateTimeout.current = setTimeout(() => {
            fetch("/api/v1/reading-progress", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                linkId: link.id,
                percent,
                textPosition,
              }),
            });
          }, 1000);
        }
      }
    };

    const onUnload = () => {
      if (link?.id && container) {
        const height = container.scrollHeight - container.clientHeight;
        if (height > 0) {
          const percent = (container.scrollTop / height) * 100;

          const anchorEl = getFirstVisibleElement(container);
          const textPosition = anchorEl
            ? getTextAnchor(container, anchorEl)
            : null;

          // Use sendBeacon for reliable unload data transmission
          const blob = new Blob(
            [JSON.stringify({ linkId: link.id, percent, textPosition })],
            { type: "application/json" }
          );
          navigator.sendBeacon("/api/v1/reading-progress", blob);
        }
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", onUnload);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onUnload);
      // Also save on component unmount (e.g. client-side navigation)
      onUnload();
    };
  }, [router.query.format, link?.id]);

  return (
    <div>
      {link?.id && (
        <PreservationNavbar
          link={link}
          format={Number(router.query.format)}
          showNavbar={showNavbar}
        />
      )}
      <div
        className={`bg-base-200 overflow-y-auto w-screen  ${
          showNavbar ? "h-[calc(100vh-3.1rem)] mt-[3.1rem]" : "h-screen"
        }`}
        ref={scrollRef}
      >
        <PreservationContent link={link} format={Number(router.query.format)} />
      </div>
    </div>
  );
}
