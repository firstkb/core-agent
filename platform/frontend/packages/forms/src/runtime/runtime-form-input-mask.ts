export function hasRuntimeTextMask(mask: string | undefined) {
  return Boolean(mask?.trim() && /[9Aa*]/.test(mask));
}

export function applyRuntimeTextMask(value: string, mask: string | undefined) {
  const normalizedMask = mask?.trim();
  if (!normalizedMask || !hasRuntimeTextMask(normalizedMask)) {
    return value;
  }

  const inputCharacters = value.replace(/[^0-9A-Za-z]/g, "");
  let nextValue = "";
  let inputIndex = 0;

  function takeCharacter(matches: (character: string) => boolean) {
    while (inputIndex < inputCharacters.length) {
      const character = inputCharacters[inputIndex];
      inputIndex += 1;
      if (character && matches(character)) {
        return character;
      }
    }
    return "";
  }

  for (const maskCharacter of normalizedMask) {
    if (maskCharacter === "9") {
      const nextDigit = takeCharacter((character) => /\d/.test(character));
      if (!nextDigit) {
        break;
      }
      nextValue += nextDigit;
      continue;
    }

    if (maskCharacter === "A" || maskCharacter === "a") {
      const nextLetter = takeCharacter((character) => /[A-Za-z]/.test(character));
      if (!nextLetter) {
        break;
      }
      nextValue += maskCharacter === "A" ? nextLetter.toUpperCase() : nextLetter.toLowerCase();
      continue;
    }

    if (maskCharacter === "*") {
      const nextCharacter = takeCharacter(() => true);
      if (!nextCharacter) {
        break;
      }
      nextValue += nextCharacter;
      continue;
    }

    if (inputIndex < inputCharacters.length) {
      nextValue += maskCharacter;
    }
  }

  return nextValue;
}

export function isRuntimeTextMaskComplete(value: string, mask: string | undefined) {
  const normalizedMask = mask?.trim();
  if (!normalizedMask || !hasRuntimeTextMask(normalizedMask)) {
    return true;
  }

  return applyRuntimeTextMask(value, normalizedMask).length === normalizedMask.length;
}
