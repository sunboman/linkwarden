import { useUser } from "@linkwarden/router/user";
import { useEffect, useState } from "react";

export default function useEffectiveTheme() {
	const { data: user } = useUser();
	const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		if (typeof window !== "undefined") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			setSystemTheme(mediaQuery.matches ? "dark" : "light");

			const handleChange = (e: MediaQueryListEvent) => {
				setSystemTheme(e.matches ? "dark" : "light");
			};

			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}
	}, []);

	if (!user || !user.theme || user.theme === "auto") {
		return systemTheme;
	}

	return user.theme as "light" | "dark";
}
