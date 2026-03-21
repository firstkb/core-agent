type FieldMessage = {
  id: string;
  message: string;
  tone: "help" | "error";
};

function createFieldHelp(id: string, message: string): FieldMessage {
  return { id, message, tone: "help" };
}

function createFieldError(id: string, message: string): FieldMessage {
  return { id, message, tone: "error" };
}

export { createFieldError, createFieldHelp };
export type { FieldMessage };
