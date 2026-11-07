// Datas no horário de Brasília, para "hoje" não virar "amanhã" depois das 21h.
const FUSO = "America/Sao_Paulo";

// Data de hoje no formato AAAA-MM-DD.
export function hoje() {
  return new Date().toLocaleDateString("en-CA", { timeZone: FUSO });
}

export function somarDias(data: string, dias: number) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// 2026-11-07 -> "sáb., 7 de nov."
export function dataCurta(data: string) {
  return new Date(`${data}T12:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function dataLonga(data: string) {
  return new Date(`${data}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" });
}

// Início e fim de um mês (AAAA-MM) em horário de Brasília, como instantes ISO.
export function limitesDoMes(mes: string) {
  const [ano, m] = mes.split("-").map(Number);
  const proximo = m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, "0")}`;
  return { inicio: `${mes}-01T00:00:00-03:00`, fim: `${proximo}-01T00:00:00-03:00` };
}

export function nomeDoMes(mes: string) {
  const texto = new Date(`${mes}-15T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function mesAnterior(mes: string, quantos = 1) {
  const [ano, m] = mes.split("-").map(Number);
  const total = ano * 12 + (m - 1) - quantos;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function dinheiro(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
