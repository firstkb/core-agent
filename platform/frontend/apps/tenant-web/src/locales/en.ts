import type { LocaleResourceTree } from "@platform/i18n";

export const tenantEnglishMessages = {
  tenant: {
    auth: {
      descriptionCode: "Enter the Authorization Code sent to {{identifier}}.",
      descriptionEnter: "To receive an Authorization Code, please provide your email address or phone number.",
      tagline: "Fast. Efficient. Productive.",
      title: "Sign in",
    },
    loaders: {
      bootstrapDescription: "Please wait a moment.",
      bootstrapLabel: "Opening sign in",
      pendingDescription: "Checking your session.",
      pendingLabel: "Welcome",
      profileDescription: "Please wait a moment.",
      profileLabel: "Please wait",
    },
    navigation: {
      dashboard: {
        headerTitle: "Dashboard",
        label: "Dashboard",
        note: "Workspace overview",
      },
    },
    shell: {
      actionsLabel: "Workspace Actions",
      aria: {
        openNotifications: "Open notifications",
        openUserMenu: "Open user menu",
        openWorkspaceActions: "Open workspace actions",
        openWorkspaceSearch: "Open workspace search",
      },
      brand: "Tenant Workspace",
      menu: {
        dashboardRefreshed: "Dashboard placeholder set refreshed",
        favorites: "Favorites",
        loadingGuidance: "Loading state guidance available",
        notifications: "Notifications",
        openDashboard: "Open dashboard",
        operatorNotes: "{{count}} operator notes still pinned",
        reviewFavorites: "Review saved mockups",
        tasksCenter: "Tasks center",
      },
      searchPlaceholder: "Search or run command",
      searchTitle: "Workspace command search will be wired in a later step.",
      surfaceLabel: "Workspace",
    },
  },
} satisfies LocaleResourceTree;
