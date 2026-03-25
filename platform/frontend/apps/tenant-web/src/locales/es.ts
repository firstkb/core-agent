import type { LocaleResourceTree } from "@platform/i18n";

export const tenantSpanishMessages = {
  tenant: {
    auth: {
      descriptionCode: "Introduce el codigo de autorizacion enviado a {{identifier}}.",
      descriptionEnter: "Para recibir un codigo de autorizacion, proporciona tu correo electronico o numero de telefono.",
      tagline: "Rapido. Eficiente. Productivo.",
      title: "Iniciar sesion",
    },
    loaders: {
      bootstrapDescription: "Espera un momento.",
      bootstrapLabel: "Abriendo acceso",
      pendingDescription: "Comprobando tu sesion.",
      pendingLabel: "Bienvenido",
      profileDescription: "Espera un momento.",
      profileLabel: "Espera",
    },
    navigation: {
      dashboard: {
        headerTitle: "Panel",
        label: "Panel",
        note: "Resumen del espacio de trabajo",
      },
    },
    shell: {
      actionsLabel: "Acciones del espacio",
      aria: {
        openNotifications: "Abrir notificaciones",
        openUserMenu: "Abrir menu de usuario",
        openWorkspaceActions: "Abrir acciones del espacio",
        openWorkspaceSearch: "Abrir busqueda del espacio",
      },
      brand: "Espacio de trabajo",
      menu: {
        dashboardRefreshed: "El panel base fue actualizado",
        favorites: "Favoritos",
        loadingGuidance: "La guia de estados de carga esta disponible",
        notifications: "Notificaciones",
        openDashboard: "Abrir panel",
        operatorNotes: "{{count}} notas de operador siguen fijadas",
        reviewFavorites: "Revisar maquetas guardadas",
        tasksCenter: "Centro de tareas",
      },
      searchPlaceholder: "Buscar o ejecutar comando",
      searchTitle: "La busqueda de comandos del espacio se conectara en un paso posterior.",
      surfaceLabel: "Espacio de trabajo",
    },
  },
} satisfies LocaleResourceTree;
