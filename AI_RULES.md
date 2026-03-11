# AI Development Rules for ydays-psy-app

This document outlines the technical stack and specific guidelines for developing features within this application.

## Tech Stack Overview

*   **React Native / Expo:** The core framework for building universal applications that run on iOS, Android, and web from a single codebase.
*   **Expo Router:** Utilized for file-based routing, simplifying navigation management across different screens.
*   **TypeScript:** Ensures type safety throughout the codebase, improving code quality and maintainability.
*   **React Native Reanimated:** The primary library for creating fluid and performant animations.
*   **Expo Symbols:** Used for displaying native SF Symbols on iOS, providing a consistent look with the platform.
*   **@expo/vector-icons (MaterialIcons):** Serves as a fallback for icons on Android and web, ensuring icon consistency across platforms.
*   **@react-navigation/native:** Provides the underlying navigation infrastructure and theming capabilities.
*   **Tailwind CSS:** All styling should be implemented using Tailwind CSS classes for a utility-first approach.
*   **Shadcn/ui:** A collection of re-usable components that are built on Radix UI and styled with Tailwind CSS.

## Library Usage Guidelines

*   **Styling:**
    *   **ALWAYS** use Tailwind CSS for all styling. Apply classes directly to components.
    *   Leverage the existing `Colors` from `constants/theme.ts` and `useThemeColor` hook for theme-aware styling.
*   **UI Components:**
    *   **ALWAYS** try to use prebuilt components from the `shadcn/ui` library.
    *   If a required component is not available in `shadcn/ui`, create a new, small, and focused component in `src/components/`.
    *   Do not modify existing `shadcn/ui` component files; create new components if customization is needed.
*   **Navigation:**
    *   Use **Expo Router** for all routing and navigation logic.
    *   Keep route definitions within `src/App.tsx` (or `app/_layout.tsx` for Expo Router).
*   **Icons:**
    *   Use the `IconSymbol` component (from `components/ui/icon-symbol.tsx`) for all icons. This component intelligently uses Expo Symbols on iOS and MaterialIcons on other platforms.
    *   Refer to the `MAPPING` in `components/ui/icon-symbol.tsx` for available SF Symbol to Material Icon mappings.
*   **Animations:**
    *   Implement animations using `react-native-reanimated`.
*   **Theming:**
    *   Utilize the `useColorScheme` hook (from `hooks/use-color-scheme.ts`) to detect the user's preferred color scheme.
    *   Use the `useThemeColor` hook (from `hooks/use-theme-color.ts`) to apply theme-aware colors to components.
    *   Define new colors in `constants/theme.ts` if necessary, ensuring both `light` and `dark` variants are provided.
*   **Component Structure:**
    *   **ALWAYS** create a new file for every new component or hook, no matter how small.
    *   New components should reside in `src/components/`.
    *   New pages should reside in `src/pages/`.
    *   Aim for components that are 100 lines of code or less. Refactor larger components into smaller, more manageable ones.
*   **Error Handling:**
    *   Do **NOT** implement `try/catch` blocks for error handling unless specifically requested by the user. Errors should bubble up for easier debugging.
*   **External Services (Auth, Database, API Keys):**
    *   If a user requests features requiring authentication, database interaction, or server-side functions (e.g., loading API keys), suggest adding **Supabase** integration.
*   **Code Quality:**
    *   Prioritize simple, elegant, and maintainable code. Avoid over-engineering.
    *   Ensure all code is complete, syntactically correct, and follows existing project conventions.
    *   Do not make partial implementations or leave `TODO` comments for the user to complete.