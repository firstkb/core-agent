import type { LocaleResourceTree } from "@platform/i18n";

export const appShellSpanishMessages = {
  appUpdate: {
    message: "Hay una nueva version disponible. Actualiza para cargar los cambios mas recientes.",
    reload: "Actualizar",
  },
  auth: {
    actions: {
      requestCode: "Enviar codigo",
      verifyCode: "Verificar codigo",
    },
    back: "Usar otro contacto",
    errors: {
      enterCode: "Introduce el codigo de autorizacion para continuar.",
      enterEmail: "Introduce un correo electronico para continuar.",
      enterPhone: "Introduce un numero de telefono para continuar.",
      unableToSendCode: "No fue posible enviar el codigo.",
      unableToVerifyCode: "No fue posible verificar el codigo.",
    },
    footer: {
      copyright: "© {{year}} {{companyName}}. Todos los derechos reservados.",
    },
    labels: {
      code: "Codigo de autorizacion",
      email: "Correo electronico",
      phone: "Numero de telefono",
    },
    methods: {
      email: "Correo",
      label: "Metodo de acceso",
      phone: "Telefono",
    },
    placeholders: {
      email: "Introduce tu correo electronico",
      phone: "Introduce tu numero de telefono",
    },
  },
  common: {
    current: "Actual",
    language: "Idioma",
    languages: {
      en: "English",
      es: "Espanol",
    },
    themes: {
      dark: "Oscuro",
      light: "Claro",
    },
  },
  shell: {
    actions: {
      collapseNavigation: "Contraer navegacion",
      expandNavigation: "Expandir navegacion",
      switchToDarkTheme: "Cambiar a tema oscuro",
      switchToLightTheme: "Cambiar a tema claro",
    },
    aria: {
      closeNavigation: "Cerrar navegacion",
      openNavigation: "Abrir navegacion",
      platformUtilities: "Utilidades de plataforma",
      primary: "Principal",
      primaryModuleNavigation: "Navegacion principal del modulo",
    },
    brand: {
      firstkbPlatform: "Plataforma FirstKB",
    },
    menu: {
      language: "Idioma",
      myProfile: "Mi perfil",
      preferences: "Preferencias",
      signOut: "Cerrar sesion",
      themeSwitcher: "Cambiar tema",
    },
  },
} satisfies LocaleResourceTree;
