import type { LocaleResourceTree } from "@platform/i18n";

export const installHelperSpanishMessages = {
  install: {
    actions: {
      addToDock: "Agregar al Dock",
      addToHomeScreen: "Agregar a inicio",
      close: "Cerrar",
      hidePrompt: "Ocultar instalacion",
      install: "Instalar",
    },
    copy: {
      addToDock:
        "Este sitio tiene funciones de aplicacion. Agregalo al Dock para una experiencia mas amplia y acceso rapido.",
      addToHomeScreen:
        "Este sitio tiene funciones de aplicacion. Agregalo a la pantalla de inicio para una experiencia mas amplia y acceso rapido.",
    },
    steps: {
      addToDock: "Pulsa Agregar al Dock",
      addToHomeScreen: "Pulsa Agregar a inicio",
      openSafari: "Abre el sitio en Safari",
      pressShare: "Pulsa Compartir en la barra de navegacion",
    },
  },
} satisfies LocaleResourceTree;
