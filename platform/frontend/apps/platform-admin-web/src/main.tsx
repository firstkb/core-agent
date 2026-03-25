import { createRoot } from "react-dom/client";

import "@platform/app-shell/styles.css";

import { Root } from "./app/root";

createRoot(document.getElementById("root") as HTMLElement).render(
  <Root />,
);
