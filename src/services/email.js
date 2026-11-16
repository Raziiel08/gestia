const PROVEEDORES_PERMITIDOS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "protonmail.com",
  "proton.me",
];

export function normalizarEmail(email) {
  return (email ?? "").trim().toLowerCase();
}

export function dominioEmailPermitido(email) {
  const limpio = normalizarEmail(email);
  const separador = limpio.lastIndexOf("@");
  if (separador <= 0) return false;

  const local = limpio.slice(0, separador);
  const dominio = limpio.slice(separador + 1);

  if (
    !/^[a-z0-9._%+-]+$/.test(local) ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  ) {
    return false;
  }
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(
      dominio,
    )
  ) {
    return false;
  }

  if (PROVEEDORES_PERMITIDOS.includes(dominio)) return true;
  return dominio.endsWith(".edu") || dominio.endsWith(".edu.ar");
}

export function mensajeEmailInvalido() {
  return "El correo ingresado no es válido o no está habilitado. Probá con otro.";
}
