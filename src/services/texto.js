export function interpolar(texto, valores = {}) {
  if (texto === null || texto === undefined) return "";
  return String(texto).replace(/\{(\w+)\}/g, (coincidencia, clave) => {
    const valor = valores[clave];
    if (valor === null || valor === undefined) return coincidencia;
    return String(valor);
  });
}
