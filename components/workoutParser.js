export function parseWorkout(text) {
  if (!text || typeof text !== "string") return null;

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const typeLine = lines.find(l => l.startsWith("[TIPO:"));
  if (!typeLine) return null;

  const tipo = typeLine
    .replace("[TIPO:", "")
    .replace("]", "")
    .trim()
    .toUpperCase();

  // =========================
  // ESERCIZIO PARSER
  // =========================
  const parseExerciseLine = (line) => {
    const parts = line.split("|").map(v => v.trim());

    if (parts.length < 2) return null;

    const nome = parts[0];
    const serieRip = parts[1];
    const recupero = parts[2] || null;

    const match = serieRip.match(/(\d+)\s*x\s*(\d+)/i);

    if (!match) return null;

    return {
      nome,
      serie: Number(match[1]),
      ripetizioni: Number(match[2]),
      recupero,
    };
  };

  const isExerciseLine = (line) =>
    line.includes("|") && !line.startsWith("[");

  // =========================
  // UNICA
  // =========================
  if (tipo === "UNICA") {
    const esercizi = lines
      .filter(isExerciseLine)
      .map(parseExerciseLine)
      .filter(Boolean);

    return {
      tipo: "UNICA",
      esercizi,
    };
  }

  // =========================
  // SETTIMANALE
  // =========================
  if (tipo === "SETTIMANALE") {
    const giorni = [];
    let currentDay = null;

    for (const line of lines) {
      if (line.startsWith("[TIPO:")) continue;

      if (line.startsWith("[GIORNO:")) {
        const nome = line
          .replace("[GIORNO:", "")
          .replace("]", "")
          .trim()
          .toUpperCase();

        currentDay = {
          nome,
          esercizi: [],
        };

        giorni.push(currentDay);
        continue;
      }

      if (currentDay && isExerciseLine(line)) {
        const ex = parseExerciseLine(line);
        if (ex) currentDay.esercizi.push(ex);
      }
    }

    return {
      tipo: "SETTIMANALE",
      giorni,
    };
  }

  return null;
}