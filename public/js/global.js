
(function () {
    const THEME_KEY = "apexPortalTheme";
    const validThemes = ["light", "dark", "system"];

    function getThemePreference() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            return validThemes.includes(saved) ? saved : "system";
        } catch (error) {
            return "system";
        }
    }

    function applyPortalTheme() {
        const preference = getThemePreference();

        const systemDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

        const theme = preference === "system"
            ? (systemDark ? "dark" : "light")
            : preference;

        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute(
            "data-theme-preference",
            preference
        );

        document.documentElement.style.colorScheme = theme;
    }

    // Apply the saved theme on every page.
    applyPortalTheme();

    // Update when the theme changes in another browser tab.
    window.addEventListener("storage", function (event) {
        if (event.key === THEME_KEY) {
            applyPortalTheme();
        }
    });

    // Follow operating-system changes in System mode.
    const systemPreference = window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

    if (systemPreference.addEventListener) {
        systemPreference.addEventListener("change", function () {
            if (getThemePreference() === "system") {
                applyPortalTheme();
            }
        });
    }

    // Used by the Settings page.
    window.applyPortalTheme = applyPortalTheme;
})();
