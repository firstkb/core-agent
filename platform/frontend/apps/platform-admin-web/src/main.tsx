import { createRoot } from "react-dom/client";

import { bootstrapAppInstallCapture } from "@platform/app-shell";
import "@platform/app-shell/styles.css";

import { Root } from "./app/root";

bootstrapAppInstallCapture();

createRoot(document.getElementById("root") as HTMLElement).render(
  <Root />,
);
