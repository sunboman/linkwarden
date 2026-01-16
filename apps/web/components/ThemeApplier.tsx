import { useUser } from "@linkwarden/router/user";
import { useEffect } from "react";

/**
 * This component applies the theme based on user preference from React Query.
 * It listens to user data changes and applies the correct data-theme attribute.
 */
export default function ThemeApplier() {
  const { data: user } = useUser();

  useEffect(() => {
    if (!user) return;

    const applyTheme = (theme: "light" | "dark") => {
      document.documentElement.setAttribute("data-theme", theme);
    };

    if (user.theme === "auto" || !user.theme) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        applyTheme(e.matches ? "dark" : "light");
      };

      // Set initial theme based on system preference
      handleChange(mediaQuery);

      // Listen for system theme changes
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      applyTheme(user.theme as "light" | "dark");
    }
  }, [user?.theme]);

  return null;
}
