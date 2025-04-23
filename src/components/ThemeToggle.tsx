import { useState, useEffect } from "react";

import { Moon, Sun1 } from "iconsax-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Fixes the issue of hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (!theme) {
      setTheme("light"); // Fallback default
    }
  }, [theme, setTheme]);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-lg border !border-nomyx-gray4-light dark:!border-nomyx-gray4-dark w-10 h-10 flex items-center justify-center"
    >
      {resolvedTheme === "dark" ? <Sun1 className="text-yellow-300 w-8 h-8" /> : <Moon className="text-yellow-300 w-8 h-8" />}
    </button>
  );
}
