export function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function lineAt(document: string, lineSeparator: string, charIndex: number): number {
  if (charIndex < 0 || charIndex > document.length) {
    throw new Error("Character index out of bounds");
  }
  let line = 0;
  let i = 0;
  while (i < charIndex) {
    if (
      document.charAt(i + lineSeparator.length - 1) &&
      document.slice(i, i + lineSeparator.length) === lineSeparator
    ) {
      line++;
      i += lineSeparator.length;
    } else {
      i++;
    }
  }
  return line;
}
