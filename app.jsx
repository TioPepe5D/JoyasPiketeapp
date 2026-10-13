// React, Recharts y los íconos (lucide-react) se cargan desde index.html como librerías globales.
const { useState, useEffect, useLayoutEffect, useCallback, useRef } = React;
const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, LabelList } = Recharts;
const {
  Plus,
  Trash2,
  Pencil,
  LogOut,
  X,
  Send,
  Share2,
  Lock,
  Receipt,
  History,
  BarChart3,
  TrendingUp,
  Settings,
  Copy,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  MessageCircle,
  RefreshCw,
} = LucideReact;

const GERENTE = "Joyas Pikete";
const VENDEDORES = [
  "Joyas BrilliantBlue",
  "Joyas Wiz",
  "Joyas Victory",
  "Joyero Maximo",
  "StarJoyas",
];
const PERSONAS = [GERENTE, ...VENDEDORES];

const PRECIOS_INICIALES = {
  "Cadenas Hombre": 520,
  "Pulseras Hombre y mujer": 550,
  "Cadenas Mujer": 550,
  "Aros y Colgantes Microzircon": 850,
  "Colgantes Lisos": 950,
  "Cadenas Microzircon": 800,
  "Tennis Normal": 800,
  "Tennis Conector": 850,
  "Pulsera Conector": 650,
  "Oro Goldfit": 1700,
  "Cadenas Delgadas": 650,
  "Anillos Microzircon": 950,
};

const COSTOS_REALES_INICIALES = {
  "Cadenas Hombre": 390,
  "Pulseras Hombre y mujer": 410,
  "Cadenas Mujer": 410,
  "Aros y Colgantes Microzircon": 550,
  "Colgantes Lisos": 550,
  "Cadenas Microzircon": 660,
  "Tennis Normal": 450,
  "Tennis Conector": 500,
  "Pulsera Conector": 480,
  "Oro Goldfit": 1300,
  "Cadenas Delgadas": 410,
  "Anillos Microzircon": 0,
};

const ICONOS_MATERIALES = {
  "Cadenas Hombre": "👨",
  "Pulseras Hombre y mujer": "📿",
  "Cadenas Mujer": "👩",
  "Aros y Colgantes Microzircon": "💎",
  "Colgantes Lisos": "🔹",
  "Cadenas Microzircon": "💎",
  "Tennis Normal": "🌟",
  "Tennis Conector": "🌟",
  "Pulsera Conector": "🪢",
  "Oro Goldfit": "🍯",
  "Cadenas Delgadas": "👩",
  "Anillos Microzircon": "💍",
};
const ICONO_MATERIAL_DEFAULT = "💠";
// Por nombre exacto y tambien por palabras clave, para que sirva con categorias nuevas
// (por ejemplo "Oro Goldfit Microzircon" o cualquier "Tennis ...").
function iconoMaterial(nombre) {
  const n = String(nombre || "").toLowerCase();
  if (n.includes("tennis")) return "🌟";
  if (n.includes("goldfit")) return "🍯";
  if (n.includes("cadena") && n.includes("microzircon")) return "💎";
  if (n.includes("cadena") && n.includes("hombre")) return "👨";
  if (n.includes("cadena") && (n.includes("mujer") || n.includes("delgada"))) return "👩";
  return ICONOS_MATERIALES[nombre] || ICONO_MATERIAL_DEFAULT;
}

function fusionarYEliminarCategorias(catalogo) {
  const copia = { ...catalogo };
  let cambio = false;
  if (copia["Aros Microzircon"] != null || copia["Colgantes Microzircon"] != null) {
    if (copia["Aros y Colgantes Microzircon"] == null) {
      copia["Aros y Colgantes Microzircon"] =
        copia["Aros Microzircon"] != null ? copia["Aros Microzircon"] : copia["Colgantes Microzircon"];
    }
    delete copia["Aros Microzircon"];
    delete copia["Colgantes Microzircon"];
    cambio = true;
  }
  if (copia["Aros Lisos"] != null) {
    delete copia["Aros Lisos"];
    cambio = true;
  }
  return { catalogo: copia, cambio };
}

function normalizarItem(item) {
  if (item.tipo === "regalo") {
    return { ...item, tipo: item.regaloTipo || "por_gramo", esRegalo: true };
  }
  return { ...item, esRegalo: !!item.esRegalo };
}

const PIN_INICIAL = "1234";

const PERIODOS = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 dias" },
  { id: "mes", label: "Este mes" },
  { id: "todo", label: "Todo" },
];

const GRANULARIDADES = [
  { id: "diario", label: "Diario" },
  { id: "semanal", label: "Semanal" },
  { id: "mensual", label: "Mensual" },
  { id: "anual", label: "Anual" },
];

// Navegacion: 4 pestanas para el gerente (Venta, Historial, Reportes, Graficos) y 3 para los vendedores.
// Precios, Costo real, Lotes y Equipo estan en Ajustes (boton de engranaje, solo gerente).
const TABS_GERENTE = [
  { id: "venta", label: "Venta", icono: Receipt },
  { id: "historial", label: "Historial", icono: History },
  { id: "reportes", label: "Reportes", icono: BarChart3 },
  { id: "graficos", label: "Gráficos", icono: TrendingUp },
];
const TABS_VENDEDOR = TABS_GERENTE.filter((t) => t.id !== "graficos");
const SECCIONES_AJUSTES = [
  { id: "precios", label: "Precios" },
  { id: "costoreal", label: "Costo real" },
  { id: "lotes", label: "Lotes" },
  { id: "equipo", label: "Equipo" },
];

/* ---------- utilidades ---------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isoDeDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISOLocal(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function todayISO() {
  return isoDeDate(new Date());
}

function formatCLP(n) {
  const v = Number.isFinite(n) ? n : 0;
  const texto = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.abs(v));
  // Negativo como -$70.115 (y no $-70.115)
  return Math.round(v) < 0 ? `-${texto}` : texto;
}

function formatGramos(n) {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toLocaleString("es-CL", { maximumFractionDigits: 2 })} g`;
}

function formatFechaCorta(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function inRango(fecha, desde, hasta) {
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
}

function rangoPorPeriodo(periodo) {
  const hoy = todayISO();
  if (periodo === "hoy") return { desde: hoy, hasta: hoy };
  if (periodo === "7d") {
    const dt = parseISOLocal(hoy);
    dt.setDate(dt.getDate() - 6);
    return { desde: isoDeDate(dt), hasta: hoy };
  }
  if (periodo === "mes") {
    const [y, m] = hoy.split("-");
    return { desde: `${y}-${m}-01`, hasta: hoy };
  }
  return { desde: "", hasta: "" };
}

function lunesDeSemana(iso) {
  const dt = parseISOLocal(iso);
  const dow = dt.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  dt.setDate(dt.getDate() + diff);
  return isoDeDate(dt);
}

function sumar(ventas) {
  return ventas.reduce(
    (acc, v) => ({
      costo: acc.costo + (v.costoTotal || 0),
      venta: acc.venta + (v.precioVentaTotal || 0),
      ganancia: acc.ganancia + (v.gananciaTotal || 0),
    }),
    { costo: 0, venta: 0, ganancia: 0 }
  );
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function sumarDiasISO(iso, n) {
  const d = parseISOLocal(iso);
  d.setDate(d.getDate() + n);
  return isoDeDate(d);
}

// Periodo navegable: offset 0 = el actual, -1 = el anterior, etc.
function rangoPeriodo(gran, offset = 0) {
  const hoy = todayISO();
  if (gran === "diario") {
    const iso = sumarDiasISO(hoy, offset);
    let etiqueta;
    if (offset === 0) etiqueta = "Hoy";
    else if (offset === -1) etiqueta = "Ayer";
    else {
      const d = parseISOLocal(iso);
      etiqueta = `${DIAS_CORTOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
    }
    return { desde: iso, hasta: iso, etiqueta };
  }
  if (gran === "semanal") {
    const lunes = sumarDiasISO(lunesDeSemana(hoy), offset * 7);
    const domingo = sumarDiasISO(lunes, 6);
    const a = parseISOLocal(lunes);
    const b = parseISOLocal(domingo);
    const rangoTxt = `${a.getDate()} ${MESES_CORTOS[a.getMonth()]} – ${b.getDate()} ${MESES_CORTOS[b.getMonth()]}`;
    return { desde: lunes, hasta: domingo, etiqueta: offset === 0 ? `Esta semana · ${rangoTxt}` : rangoTxt };
  }
  if (gran === "mensual") {
    const d = parseISOLocal(hoy);
    const ini = new Date(d.getFullYear(), d.getMonth() + offset, 1);
    const fin = new Date(ini.getFullYear(), ini.getMonth() + 1, 0);
    return { desde: isoDeDate(ini), hasta: isoDeDate(fin), etiqueta: `${MESES[ini.getMonth()]} de ${ini.getFullYear()}` };
  }
  const y = parseISOLocal(hoy).getFullYear() + offset;
  return { desde: `${y}-01-01`, hasta: `${y}-12-31`, etiqueta: String(y) };
}

// Cambio porcentual contra el periodo anterior (null si no hay con que comparar).
function variacionPct(actual, anterior) {
  if (!(anterior > 0)) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

// Que fraccion del periodo actual ya paso (para proyectar al ritmo actual). null si no aplica.
function fraccionTranscurrida(gran) {
  const hoy = parseISOLocal(todayISO());
  if (gran === "mensual") {
    const dias = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    return hoy.getDate() / dias;
  }
  if (gran === "semanal") {
    const dow = hoy.getDay() === 0 ? 7 : hoy.getDay();
    return dow / 7;
  }
  if (gran === "anual") {
    const ini = new Date(hoy.getFullYear(), 0, 1);
    const fin = new Date(hoy.getFullYear() + 1, 0, 1);
    return (Math.floor((hoy - ini) / 86400000) + 1) / Math.round((fin - ini) / 86400000);
  }
  return null;
}

function abreviar(v) {
  const n = Number.isFinite(v) ? v : 0;
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1).replace(".0", "")}M`;
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

function etiquetaDia(fecha) {
  const hoy = todayISO();
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDiasISO(hoy, -1)) return "Ayer";
  const d = parseISOLocal(fecha);
  const base = `${DIAS_CORTOS[d.getDay()]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
  return d.getFullYear() === parseISOLocal(hoy).getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

// Hora (HH:MM) en que se registro la venta; solo se muestra si se registro el mismo dia de la fecha de la venta.
function horaDeVenta(v) {
  if (!v.timestamp) return "";
  const d = new Date(v.timestamp);
  if (isNaN(d.getTime())) return "";
  if (isoDeDate(d) !== v.fecha) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function gramosDeVenta(v) {
  return (v.items || []).reduce((acc, item) => {
    const it = normalizarItem(item);
    if (it.tipo === "por_gramo") return acc + (parseFloat(it.gramos) || 0);
    if (it.tipo === "lote") return acc + Object.values(it.pesosLote || {}).reduce((a, g) => a + (parseFloat(g) || 0), 0);
    return acc;
  }, 0);
}

function inicialDe(nombre) {
  const limpio = (nombre || "").replace(/^(Joyas|Joyero)\s+/i, "");
  return (limpio[0] || "?").toUpperCase();
}

const COLORES_PERSONAS = {
  "Joyas Pikete": "#F2B93D",
  "Joyas BrilliantBlue": "#F472B6",
  "Joyas Wiz": "#38BDF8",
  "Joyas Victory": "#4ADE80",
  "Joyero Maximo": "#A78BFA",
  StarJoyas: "#FB923C",
};
const COLORES_LINEAS = ["#F2B93D", "#38BDF8", "#4ADE80", "#F472B6", "#A78BFA", "#FB923C", "#94A3B8"];
function colorDe(nombre) {
  return COLORES_PERSONAS[nombre] || "#9C9AA5";
}

function ultimosMeses(n, hastaISO) {
  const d = parseISOLocal(hastaISO);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      clave: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`,
      etiqueta: MESES_CORTOS[x.getMonth()].toUpperCase(),
    });
  }
  return out;
}

// Una fila por dia del mes que contiene `desde` (ISO del dia 1).
function serieDiariaMes(ventas, desde) {
  const [y, m] = desde.split("-").map(Number);
  const dias = new Date(y, m, 0).getDate();
  const prefijo = `${y}-${String(m).padStart(2, "0")}-`;
  const hoy = todayISO();
  const filas = Array.from({ length: dias }, (_, i) => {
    const futuro = `${prefijo}${String(i + 1).padStart(2, "0")}` > hoy;
    return { dia: i + 1, venta: futuro ? null : 0, ganancia: futuro ? null : 0, ventas: futuro ? null : 0 };
  });
  ventas.forEach((v) => {
    if (!v.fecha || !v.fecha.startsWith(prefijo)) return;
    const f = filas[parseInt(v.fecha.slice(8, 10), 10) - 1];
    if (!f) return;
    f.venta = (f.venta || 0) + (v.precioVentaTotal || 0);
    f.ganancia = (f.ganancia || 0) + (v.gananciaTotal || 0);
    f.ventas = (f.ventas || 0) + 1;
  });
  return filas;
}

// Mejores dias de la semana y mejores horarios (segun la hora en que se registro cada venta).
function patronAgenda(ventas) {
  const dias = Array(7).fill(0);
  const horas = Array(24).fill(0);
  ventas.forEach((v) => {
    if (v.fecha) dias[parseISOLocal(v.fecha).getDay()] += 1;
    if (v.timestamp) {
      const h = new Date(v.timestamp).getHours();
      if (!isNaN(h)) horas[h] += 1;
    }
  });
  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const topDias = dias
    .map((n, i) => ({ nombre: nombresDias[i], n }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);
  const topHoras = horas
    .map((n, h) => ({ nombre: `${String(h).padStart(2, "0")}:00`, n }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);
  return { topDias, topHoras };
}

function textoProductosVenta(v) {
  return (v.items || [])
    .map((item) => {
      const it = normalizarItem(item);
      if (it.tipo === "lote") return `Lote${it.nombreLote ? " " + it.nombreLote : ""} (${formatGramos(gramosDeVenta({ items: [it] }))})`;
      if (it.tipo === "insumo") return `${it.material}${it.cantidad > 1 ? " x" + it.cantidad : ""}`;
      return `${it.material} ${formatGramos(it.gramos)}`;
    })
    .join(" + ");
}

// CSV para abrir en Excel (separador ";" y tildes correctas). Con costosReales agrega las columnas privadas.
function ventasACSV(ventas, costosReales, comisiones) {
  const celda = (x) => {
    const s = String(x == null ? "" : x);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const cab = ["Fecha", "Hora", "Cliente", "Canal", "Agendó", "Atendió", "Pagó a", "Productos", "Gramos", "Costo", "Venta", "Ganancia", "Ticket costo"];
  if (costosReales) cab.push("Costo real", "Mi ganancia real");
  const filas = [...ventas]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.timestamp || "").localeCompare(b.timestamp || ""))
    .map((v) => {
      const fila = [
        v.fecha,
        horaDeVenta(v),
        v.cliente || "",
        v.canal === "online" ? "Online" : "Presencial",
        v.vendedor,
        v.atendidoPor || v.vendedor,
        v.pagadoA || "",
        textoProductosVenta(v),
        Math.round(gramosDeVenta(v) * 100) / 100,
        v.costoTotal || 0,
        v.precioVentaTotal || 0,
        v.gananciaTotal || 0,
        requiereTicketCosto(v) ? (ticketConfirmado(v) ? "Transferido" : "Sin ticket") : "-",
      ];
      if (costosReales) {
        fila.push(calcularCostoRealVenta(v, costosReales), calcularGananciaRealVenta(v, costosReales, comisiones));
      }
      return fila;
    });
  return "﻿" + [cab, ...filas].map((f) => f.map(celda).join(";")).join("\n");
}

function descargarArchivo(nombre, contenido, tipo) {
  try {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (e) {
    return false;
  }
}


function gananciaEfectivaDePersona(venta, nombre) {
  if (venta.compartida) {
    if (venta.vendedor === nombre || venta.atendidoPor === nombre) return (venta.gananciaTotal || 0) / 2;
    return 0;
  }
  return venta.vendedor === nombre ? venta.gananciaTotal || 0 : 0;
}

function calcularComisionVenta(venta, nombre, comisiones) {
  const porcentaje = (comisiones && comisiones[nombre]) || 0;
  if (!porcentaje) return 0;
  return Math.round(gananciaEfectivaDePersona(venta, nombre) * (porcentaje / 100));
}

// ---- Reparto de ganancia y transferencias: cuanto le toca a cada uno y quien debe transferir que a quien ----
// Quien recibio el pago del cliente (pagadoA) tiene toda la plata: transfiere su parte a los demas
// y el costo (a precio de vendedores) a Joyas Pikete.
function calcularLiquidacion(v) {
  const agendo = v.vendedor;
  const atendio = v.atendidoPor || v.vendedor;
  const compartida = !!v.compartida && atendio !== agendo;
  const ganancia = Math.round(v.gananciaTotal || 0);
  const costo = Math.round(v.costoTotal || 0);
  const pct = compartida ? 50 : 100;
  const partes = compartida
    ? [
        { nombre: agendo, monto: Math.round(ganancia / 2) },
        { nombre: atendio, monto: Math.round(ganancia / 2) },
      ]
    : [{ nombre: agendo, monto: ganancia }];
  const pagador = v.pagadoA || "";
  const transferencias = [];
  if (pagador) {
    partes.forEach((pt) => {
      if (pt.nombre !== pagador && pt.monto > 0) {
        transferencias.push({ tipo: "ganancia", desc: `${pct}%`, a: pt.nombre, monto: pt.monto });
      }
    });
    if (pagador !== GERENTE && costo > 0) {
      transferencias.push({ tipo: "costo", desc: "Costo", a: GERENTE, monto: costo });
    }
  }
  return { agendo, atendio, compartida, pct, ganancia, costo, partes, pagador, transferencias };
}

// El costo se transfiere a Joyas Pikete cuando el pago lo recibio otra persona; el gerente confirma con un ticket.
function requiereTicketCosto(v) {
  return !!v.pagadoA && v.pagadoA !== GERENTE && (v.costoTotal || 0) > 0;
}
function ticketConfirmado(v) {
  return !!(v.ticketCosto && v.ticketCosto.fecha);
}
function costosPendientes(ventas) {
  const pend = ventas.filter((v) => requiereTicketCosto(v) && !ticketConfirmado(v));
  const porPersona = {};
  pend.forEach((v) => {
    const x = porPersona[v.pagadoA] || { nombre: v.pagadoA, cantidad: 0, monto: 0 };
    x.cantidad += 1;
    x.monto += Math.round(v.costoTotal || 0);
    porPersona[v.pagadoA] = x;
  });
  return {
    cantidad: pend.length,
    total: pend.reduce((a, v) => a + Math.round(v.costoTotal || 0), 0),
    porPersona: Object.values(porPersona).sort((a, b) => b.monto - a.monto),
  };
}

function calcularCostoRealVenta(venta, costosReales) {
  return (venta.items || []).reduce((acc, item) => {
    const it = normalizarItem(item);
    if (it.tipo === "por_gramo") {
      const precioReal = (costosReales && costosReales[it.material]) || 0;
      return acc + Math.round((it.gramos || 0) * precioReal);
    }
    if (it.tipo === "lote") {
      const pesos = it.pesosLote || {};
      const total = Object.entries(pesos).reduce(
        (a, [m, g]) => a + (parseFloat(g) || 0) * ((costosReales && costosReales[m]) || 0),
        0
      );
      return acc + Math.round(total);
    }
    return acc + (it.costo || 0);
  }, 0);
}

// Ganancia real del gerente (Joyas Pikete) en una venta. Los vendedores ven su ganancia con el costo de vendedores;
// el gerente ve lo que gana de verdad:
//  - margen de costo: lo que cobra a los vendedores (costoTotal) menos lo que realmente le cuesta la mercaderia
//    (ej.: 30 g x $520 - 30 g x $390 = $3.900)
//  - su parte de la ganancia cuando el mismo agenda o atiende la venta (a costo de vendedores)
//  - la comision que cobra a los vendedores (si tienen una configurada)
function detalleGananciaReal(venta, costosReales, comisiones, costoRealFijo) {
  const costoReal = costoRealFijo != null ? costoRealFijo : calcularCostoRealVenta(venta, costosReales);
  const margenCosto = Math.round(venta.costoTotal || 0) - costoReal;
  const parteVenta = Math.round(gananciaEfectivaDePersona(venta, GERENTE));
  const atendio = venta.atendidoPor || venta.vendedor;
  const quienes = [venta.vendedor];
  if (venta.compartida && atendio !== venta.vendedor) quienes.push(atendio);
  const comision = quienes
    .filter((n) => n && n !== GERENTE)
    .reduce((a, n) => a + calcularComisionVenta(venta, n, comisiones), 0);
  return { costoReal, margenCosto, parteVenta, comision, total: margenCosto + parteVenta + comision };
}

function calcularGananciaRealVenta(venta, costosReales, comisiones) {
  return detalleGananciaReal(venta, costosReales, comisiones).total;
}

function sumarReal(ventas, costosReales, comisiones) {
  return ventas.reduce(
    (acc, v) => {
      const d = detalleGananciaReal(v, costosReales, comisiones);
      return {
        costoReal: acc.costoReal + d.costoReal,
        margenCosto: acc.margenCosto + d.margenCosto,
        parteVenta: acc.parteVenta + d.parteVenta,
        comision: acc.comision + d.comision,
        gananciaReal: acc.gananciaReal + d.total,
      };
    },
    { costoReal: 0, margenCosto: 0, parteVenta: 0, comision: 0, gananciaReal: 0 }
  );
}

// Texto corto de como se llega a la ganancia real: "Cobras $15.600 − costo real $11.700 = $3.900 + tu parte $X + comisión $Y"
function TextoDesgloseReal({ costoCobrado, d }) {
  return (
    <>
      Cobras {formatCLP(costoCobrado)} − costo real {formatCLP(d.costoReal)} = {formatCLP(d.margenCosto)}
      {d.parteVenta !== 0 && ` + tu parte de la venta ${formatCLP(d.parteVenta)}`}
      {d.comision > 0 && ` + comisión ${formatCLP(d.comision)}`}
    </>
  );
}

function sumarComoVendedor(ventas, nombre, comisiones) {
  return ventas
    .filter((v) => v.vendedor === nombre)
    .reduce(
      (acc, v) => {
        const factor = v.compartida ? 0.5 : 1;
        return {
          cantidad: acc.cantidad + 1,
          costo: acc.costo + (v.costoTotal || 0) * factor,
          venta: acc.venta + (v.precioVentaTotal || 0) * factor,
          ganancia: acc.ganancia + (v.gananciaTotal || 0) * factor,
          comision: acc.comision + calcularComisionVenta(v, nombre, comisiones),
        };
      },
      { cantidad: 0, costo: 0, venta: 0, ganancia: 0, comision: 0 }
    );
}

function sumarComoApoyo(ventas, nombre, comisiones) {
  return ventas
    .filter((v) => v.compartida && v.atendidoPor === nombre)
    .reduce(
      (acc, v) => ({
        cantidad: acc.cantidad + 1,
        costo: acc.costo + (v.costoTotal || 0) * 0.5,
        venta: acc.venta + (v.precioVentaTotal || 0) * 0.5,
        ganancia: acc.ganancia + (v.gananciaTotal || 0) * 0.5,
        comision: acc.comision + calcularComisionVenta(v, nombre, comisiones),
      }),
      { cantidad: 0, costo: 0, venta: 0, ganancia: 0, comision: 0 }
    );
}

function sumarTotalPersona(ventas, nombre, comisiones) {
  const a = sumarComoVendedor(ventas, nombre, comisiones);
  const b = sumarComoApoyo(ventas, nombre, comisiones);
  return {
    cantidad: a.cantidad + b.cantidad,
    costo: a.costo + b.costo,
    venta: a.venta + b.venta,
    ganancia: a.ganancia + b.ganancia,
    comision: a.comision + b.comision,
  };
}

function clientesDePersona(ventas, nombre) {
  const set = new Set();
  ventas.forEach((v) => {
    const involucrado = v.vendedor === nombre || (v.compartida && v.atendidoPor === nombre);
    if (involucrado && v.cliente && v.cliente.trim()) set.add(v.cliente.trim().toLowerCase());
  });
  return set.size;
}

function clientesPresencialesDePersona(ventas, nombre) {
  const set = new Set();
  ventas.forEach((v) => {
    if (v.canal !== "presencial") return;
    const involucrado = v.vendedor === nombre || (v.compartida && v.atendidoPor === nombre);
    if (involucrado && v.cliente && v.cliente.trim()) set.add(v.cliente.trim().toLowerCase());
  });
  return set.size;
}

function ventasOnlineDePersona(ventas, nombre) {
  return ventas.filter(
    (v) => v.canal === "online" && (v.vendedor === nombre || (v.compartida && v.atendidoPor === nombre))
  ).length;
}

function productosMasVendidos(ventas) {
  const mapa = {};
  function sumarProducto(material, gramos, ingresos, esInsumo = false) {
    if (!mapa[material]) mapa[material] = { material, cantidad: 0, gramos: 0, ingresos: 0, esInsumo };
    mapa[material].cantidad += 1;
    mapa[material].gramos += gramos;
    mapa[material].ingresos += ingresos;
  }
  ventas.forEach((v) => {
    const itemsV = (v.items || []).map(normalizarItem);
    // Venta con monto total: los productos no tienen precio propio, asi que el monto se reparte segun su costo.
    let ingresoDe = (it) => it.precioVenta || 0;
    if (v.ventaPorTotal) {
      const vendibles = itemsV.filter((it) => !it.esRegalo);
      const base = vendibles.reduce((a, it) => a + (it.costo || 0), 0);
      ingresoDe = (it) =>
        base > 0
          ? ((it.costo || 0) / base) * (v.precioVentaTotal || 0)
          : (v.precioVentaTotal || 0) / (vendibles.length || 1);
    }
    itemsV.forEach((it) => {
      if (it.esRegalo) return;
      if (it.tipo === "lote") {
        const pesos = it.pesosLote || {};
        const pesoTotal = Object.values(pesos).reduce((a, g) => a + (parseFloat(g) || 0), 0);
        Object.entries(pesos).forEach(([m, g]) => {
          const gramos = parseFloat(g) || 0;
          const ingresos = pesoTotal > 0 ? (gramos / pesoTotal) * ingresoDe(it) : 0;
          sumarProducto(m, gramos, ingresos);
        });
        return;
      }
      sumarProducto(it.material, it.tipo === "por_gramo" ? it.gramos || 0 : 0, ingresoDe(it), it.tipo === "insumo");
    });
  });
  return Object.values(mapa).sort((a, b) => b.ingresos - a.ingresos);
}

function costoRegalos(ventas) {
  return ventas.reduce((acc, v) => {
    const items = v.items || [];
    return (
      acc +
      items.reduce((a, item) => {
        const it = normalizarItem(item);
        return it.esRegalo ? a + (it.costo || 0) : a;
      }, 0)
    );
  }, 0);
}

// Tipo con el que parte un producto nuevo: "lote" (primer producto Online), "insumo" o "por_gramo" (Presencial, como siempre).
function nuevoItemVacio(materiales, tipo = "por_gramo") {
  return {
    id: uid(),
    tipo,
    material: materiales[0] || "",
    gramos: "",
    insumoNombre: "",
    costoInsumo: "",
    cantidad: "1",
    pesosLote: {},
    nombreLote: "",
    esRegalo: false,
    precioVenta: "",
    precioGramoVenta: "",
  };
}

function itemAFormulario(item, materiales) {
  const it = normalizarItem(item);
  const cantidad = it.cantidad != null ? it.cantidad : 1;
  const costoUnitario = it.tipo === "insumo" && it.costo != null ? it.costo / (cantidad || 1) : it.costo;
  const pesosLoteForm = {};
  if (it.tipo === "lote" && it.pesosLote) {
    Object.entries(it.pesosLote).forEach(([m, g]) => {
      pesosLoteForm[m] = String(g);
    });
  }
  return {
    id: it.id || uid(),
    tipo: it.tipo,
    material: it.tipo === "por_gramo" ? it.material : materiales[0] || "",
    gramos: it.tipo === "por_gramo" && it.gramos != null ? String(it.gramos) : "",
    insumoNombre: it.tipo === "insumo" ? it.material : "",
    costoInsumo: it.tipo === "insumo" && costoUnitario != null ? String(costoUnitario) : "",
    cantidad: String(cantidad),
    pesosLote: pesosLoteForm,
    nombreLote: it.tipo === "lote" ? it.nombreLote || "" : "",
    esRegalo: it.esRegalo,
    precioVenta: it.precioVenta != null ? String(it.precioVenta) : "",
    precioGramoVenta: it.precioGramoVenta != null ? String(it.precioGramoVenta) : "",
  };
}

function calcularItem(item, precios) {
  const it = normalizarItem(item);
  if (it.tipo === "lote") {
    const pesos = it.pesosLote || {};
    const costo = Object.entries(pesos).reduce((acc, [m, g]) => acc + (parseFloat(g) || 0) * (precios[m] || 0), 0);
    const precioVenta = it.esRegalo ? 0 : parseFloat(it.precioVenta) || 0;
    return { precioGramo: 0, costo, precioVenta, ganancia: precioVenta - costo, usaPrecioGramo: false };
  }
  if (it.tipo === "por_gramo") {
    const precioGramo = precios[it.material] || 0;
    const gramosNum = parseFloat(it.gramos) || 0;
    const costo = gramosNum * precioGramo;
    let precioVenta;
    if (it.esRegalo) precioVenta = 0;
    else precioVenta = gramosNum * (parseFloat(it.precioGramoVenta) || 0);
    return { precioGramo, costo, precioVenta, ganancia: precioVenta - costo, usaPrecioGramo: true };
  }
  const costo = (parseFloat(it.costoInsumo) || 0) * (parseFloat(it.cantidad) || 1);
  const precioVenta = it.esRegalo ? 0 : parseFloat(it.precioVenta) || 0;
  return { precioGramo: 0, costo, precioVenta, ganancia: precioVenta - costo, usaPrecioGramo: false };
}

function migrarVenta(v) {
  if (v.items) {
    return {
      atendidoPor: v.vendedor,
      compartida: false,
      canal: "presencial",
      cliente: "",
      ...v,
    };
  }
  const item = {
    id: uid(),
    tipo: v.tipo || "por_gramo",
    material: v.material,
    gramos: v.gramos != null ? v.gramos : null,
    precioGramo: v.precioGramo != null ? v.precioGramo : null,
    costo: v.costo || 0,
    precioVenta: v.precioVenta || 0,
  };
  return {
    id: v.id,
    vendedor: v.vendedor,
    atendidoPor: v.vendedor,
    compartida: false,
    canal: "presencial",
    cliente: "",
    fecha: v.fecha,
    items: [item],
    costoTotal: v.costo || 0,
    precioVentaTotal: v.precioVenta || 0,
    gananciaTotal: v.ganancia != null ? v.ganancia : (v.precioVenta || 0) - (v.costo || 0),
    notas: v.notas || "",
    timestamp: v.timestamp || new Date().toISOString(),
  };
}

const CONSEJO_CUIDADO =
  "Guarda cada pieza por separado en su estuche y evita el contacto con agua, perfumes y cremas para que el brillo dure más tiempo.";

function listaNatural(lista) {
  if (lista.length <= 1) return lista.join("");
  return `${lista.slice(0, -1).join(", ")} y ${lista[lista.length - 1]}`;
}

function construirTextoResumen(venta) {
  const lineas = [];
  const hora = horaDeVenta(venta);
  const sinPrecios = !!venta.ventaPorTotal;
  lineas.push(`✨ Detalle de ${venta.cliente || "tu compra"}`);
  lineas.push(`${formatFechaCorta(venta.fecha)}${hora ? ` · ${hora}` : ""}`);
  lineas.push(`Te atendió: ${venta.atendidoPor || venta.vendedor || ""}`);
  lineas.push("");
  const nombres = [];
  (venta.items || []).forEach((item) => {
    const it = normalizarItem(item);
    const regalo = it.esRegalo ? " 🎁 Regalo" : "";
    const precio = it.esRegalo ? "Regalo" : formatCLP(it.precioVenta);
    if (it.tipo === "lote") {
      const pesos = it.pesosLote || {};
      const gramos = gramosDeVenta({ items: [it] });
      const nombre = it.nombreLote || "Lote";
      nombres.push(it.nombreLote || "lote");
      lineas.push(`📦 ${nombre}${regalo}`);
      if (!it.nombreLote) {
        lineas.push(
          `  └ ${Object.entries(pesos)
            .map(([m, g]) => `${m} ${formatGramos(g)}`)
            .join(", ")}`
        );
      }
      lineas.push(`  └ ${formatGramos(gramos)}${sinPrecios ? "" : ` · ${precio}`}`);
      lineas.push("");
      return;
    }
    if (it.tipo === "insumo") {
      nombres.push(it.material);
      lineas.push(`🧰 ${it.material}${it.cantidad > 1 ? ` x${it.cantidad}` : ""}${regalo}`);
      if (!sinPrecios || it.esRegalo) lineas.push(`  └ ${precio}`);
      lineas.push("");
      return;
    }
    nombres.push(it.material);
    lineas.push(`${iconoMaterial(it.material)} ${it.material}${regalo}`);
    if (!sinPrecios && !it.esRegalo && it.precioGramoVenta) {
      lineas.push(`  └ ${formatGramos(it.gramos)} × ${formatCLP(it.precioGramoVenta)}/g = ${precio}`);
    } else {
      lineas.push(`  └ ${formatGramos(it.gramos)}${sinPrecios && !it.esRegalo ? "" : ` · ${precio}`}`);
    }
    lineas.push("");
  });
  const peso = gramosDeVenta(venta);
  if (peso > 0) lineas.push(`Peso total: ${formatGramos(peso)}`);
  lineas.push(`Total: ${formatCLP(venta.precioVentaTotal)}`);
  lineas.push("");
  lineas.push(`¡Gracias${venta.cliente ? `, ${venta.cliente}` : ""}! Tu pedido incluye ${listaNatural(nombres)}.`);
  lineas.push("");
  lineas.push(`💡 ${CONSEJO_CUIDADO}`);
  return lineas.join("\n");
}

/* ---------- estilos ---------- */

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.app-shell {
  --ink: #0B0B0D;
  --surface: #17161B;
  --surface-2: #201F26;
  --surface-3: #2A2932;
  --border: rgba(242,199,90,0.14);
  --border-strong: rgba(242,199,90,0.30);
  --ivory: #F5F3EE;
  --muted: #9C9AA5;
  --gold: #F2B93D;
  --gold-bright: #FFD766;
  --gold-deep: #B8860B;
  --green: #6FCF97;
  --red: #E0645A;
  --gold-tint: rgba(242,185,61,0.08);
  --gold-tint-2: rgba(242,185,61,0.16);
  --radius: 8px;
  --font-display: 'Space Grotesk', 'IBM Plex Sans', sans-serif;
  --font-body: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  min-height: 100vh;
  background: var(--ink);
  color: var(--ivory);
  font-family: var(--font-body);
  display: flex;
  flex-direction: column;
}

.app-shell * { box-sizing: border-box; }

.app-shell.tema-rosado {
  --gold: #F0529E;
  --gold-bright: #FF8FCB;
  --gold-deep: #B8306E;
  --border: rgba(240,82,158,0.14);
  --border-strong: rgba(240,82,158,0.30);
  --gold-tint: rgba(240,82,158,0.09);
  --gold-tint-2: rgba(240,82,158,0.18);
}

.pantalla-centrada {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  text-align: center;
}

.login-pantalla {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  gap: 36px;
}
.login-marca { text-align: center; position: relative; }
.login-marca::before {
  content: '';
  position: absolute;
  inset: -50px -110px;
  background: radial-gradient(circle, rgba(242,185,61,0.20), transparent 70%);
  z-index: -1;
}
.login-marca-nombre {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 31px;
  line-height: 1.15;
  letter-spacing: 0.01em;
  background: linear-gradient(135deg, var(--gold-bright), var(--gold) 55%, var(--gold-deep));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 22px rgba(242,185,61,0.30));
}
.login-marca-sub {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
}
.login-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 340px;
}
.login-item {
  position: relative;
  overflow: hidden;
  font-family: var(--font-body);
  font-size: 15.5px;
  font-weight: 500;
  color: var(--ivory);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 15px 18px 15px 22px;
  text-align: left;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease;
}
.login-item::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(var(--gold-bright), var(--gold));
  transform: scaleY(0);
  transition: transform .15s ease;
}
.login-item:hover { border-color: var(--gold); background: var(--surface-2); }
.login-item:hover::before { transform: scaleY(1); }
.login-item:active { background: var(--surface-3); }

.login-pin {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 300px;
}
.login-pin-nombre {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 21px;
  color: var(--ivory);
}
.login-pin-input {
  width: 160px;
  text-align: center;
  font-size: 28px;
  letter-spacing: 10px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  color: var(--ivory);
  padding: 12px 10px 12px 20px;
  font-variant-numeric: tabular-nums;
}
.login-pin-input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(242,185,61,0.15); }
.login-pin-acciones { display: flex; gap: 10px; width: 100%; }
.login-pin-acciones .btn { flex: 1; }

.encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
}
.marca { display: flex; flex-direction: column; min-width: 0; }
.marca-nombre {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  white-space: nowrap;
  background: linear-gradient(135deg, var(--gold-bright), var(--gold));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.marca-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
.usuario-actual { display: flex; align-items: center; gap: 10px; }
.usuario-info { display: flex; flex-direction: column; align-items: flex-end; }
.usuario-nombre { font-size: 13.5px; font-weight: 600; white-space: nowrap; }
.usuario-rol { font-size: 11px; color: var(--muted); }
.icon-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--muted);
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.icon-btn:hover { color: var(--ivory); border-color: var(--border-strong); }

.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  justify-content: center;
  background: var(--ink);
  border-top: 1px solid var(--border-strong);
  padding-bottom: env(safe-area-inset-bottom);
}
.tabbar-interior { display: flex; width: 100%; max-width: 720px; }
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: transparent;
  border: none;
  border-top: 2px solid transparent;
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 11.5px;
  font-weight: 500;
  height: 58px;
  padding: 0 4px;
  cursor: pointer;
  white-space: nowrap;
}
.tab:hover { color: var(--ivory); }
.tab-activo { color: var(--gold-bright); border-top-color: var(--gold); background: var(--gold-tint); }

.contenido { flex: 1; padding: 18px 16px 90px; max-width: 720px; width: 100%; margin: 0 auto; }

.filtros-periodo { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.chip {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 12.5px;
  padding: 7px 13px;
  border-radius: 999px;
  cursor: pointer;
}
.chip-activo {
  color: var(--ink);
  background: linear-gradient(135deg, var(--gold-bright), var(--gold));
  border-color: var(--gold);
  font-weight: 600;
}

.campo { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.campo span { font-size: 12.5px; color: var(--muted); }
.campo-inline { max-width: 260px; }
.campo select, .campo input, .campo textarea {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--ivory);
  padding: 11px 12px;
  font-family: var(--font-body);
  font-size: 14.5px;
  width: 100%;
}
.campo select:focus, .campo input:focus, .campo textarea:focus {
  outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(242,185,61,0.15);
}

.campos-fila { display: flex; gap: 10px; flex-wrap: wrap; }
.campos-fila .campo-inline { flex: 1; min-width: 140px; }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
.stat-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-destacar { border-color: var(--gold); background: rgba(242,185,61,0.08); box-shadow: 0 0 16px rgba(242,185,61,0.10); }
.stat-label { font-size: 11.5px; color: var(--muted); }
.stat-valor { font-size: 19px; font-weight: 600; font-variant-numeric: tabular-nums; }

.subtitulo { font-family: var(--font-display); font-size: 16px; font-weight: 600; margin: 22px 0 10px; color: var(--ivory); }

.grafico-envoltorio { border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 4px 0; }

.destacado-doble { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 6px 0 22px; }
.destacado {
  border: 1px solid var(--gold); background: rgba(242,185,61,0.06); box-shadow: 0 0 16px rgba(242,185,61,0.10);
  border-radius: var(--radius); padding: 14px; display: flex; flex-direction: column; gap: 3px;
}
.destacado-label { font-size: 11px; color: var(--muted); }
.destacado-valor { font-family: var(--font-display); font-size: 17px; font-weight: 600; color: var(--ivory); }
.destacado-sub { font-size: 12px; color: var(--gold-bright); font-variant-numeric: tabular-nums; }

.bloque-privado { border: 1px dashed rgba(224,100,90,0.4); border-radius: var(--radius); padding: 14px 14px 2px; margin: 4px 0 22px; }
.bloque-privado .stats-grid { margin-bottom: 12px; grid-template-columns: repeat(2, 1fr); }
.aviso-privado { display: flex; align-items: center; gap: 8px; color: var(--red); font-size: 12px; font-weight: 600; margin-bottom: 10px; }

.tabla-vendedores { display: flex; flex-direction: column; }
.fila-vendedor { padding: 12px 0; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.fila-vendedor:first-child { border-top: none; }
.fila-vendedor-nombre { font-weight: 600; font-size: 14px; }
.fila-vendedor-datos { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }

.lista-ventas { display: flex; flex-direction: column; margin-top: 6px; }
.venta-fila { padding: 13px 0; border-top: 1px solid var(--border); }
.venta-fila:first-child { border-top: none; }
.venta-fila-principal { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.venta-material { font-size: 14.5px; font-weight: 600; }
.venta-meta { display: flex; gap: 10px; flex-wrap: wrap; color: var(--muted); font-size: 12px; margin-top: 3px; }
.venta-ganancia { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.positivo { color: var(--green); }
.negativo { color: var(--red); }
.venta-fila-detalle { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 6px; font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.venta-notas { margin-top: 6px; font-size: 12.5px; color: var(--muted); font-style: italic; }
.detalle-privado {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 8px; padding-top: 8px;
  border-top: 1px dashed var(--border-strong); font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums;
}
.detalle-privado svg { flex-shrink: 0; color: var(--red); }
.desglose-real { flex-basis: 100%; font-size: 11.5px; color: var(--muted); line-height: 1.4; }
.desglose-real-lista { margin-top: -4px; padding: 0 2px 4px; }
.desglose-real-lista div { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; color: var(--muted); padding: 4px 0; border-top: 1px dashed var(--border); font-variant-numeric: tabular-nums; }
.desglose-real-lista b { color: var(--ivory); font-weight: 600; white-space: nowrap; }
.venta-fila-acciones { display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap; }
.link-btn {
  background: none; border: none; color: var(--muted); font-size: 12.5px;
  display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 0;
}
.link-btn:hover { color: var(--ivory); }
.link-peligro:hover { color: var(--red); }
.confirmar-eliminar { font-size: 12.5px; color: var(--muted); display: flex; align-items: center; gap: 6px; }

.vacio { color: var(--muted); font-size: 13.5px; padding: 30px 0; text-align: center; }

.btn {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  padding: 12px 18px;
  border-radius: var(--radius);
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn-primario { background: linear-gradient(135deg, var(--gold-bright), var(--gold)); color: var(--ink); box-shadow: 0 2px 14px rgba(242,185,61,0.25); }
.btn-primario:hover { background: linear-gradient(135deg, #FFE38A, var(--gold-bright)); box-shadow: 0 2px 18px rgba(242,185,61,0.4); }
.btn-primario:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
.btn-secundario { background: transparent; border-color: var(--border-strong); color: var(--ivory); }
.btn-secundario:hover { border-color: var(--gold); }
.btn-ancho { width: 100%; margin: 6px 0 18px; }

.texto-ayuda { color: var(--muted); font-size: 13px; margin-bottom: 16px; line-height: 1.5; }
.tabla-precios { display: flex; flex-direction: column; margin-bottom: 16px; }
.fila-precio { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--border); }
.fila-precio:first-child { border-top: none; }
.fila-precio-nombre { flex: 1; font-size: 14px; }
.fila-precio-input { display: flex; align-items: center; gap: 4px; color: var(--muted); font-size: 13px; }
.fila-precio-input input {
  width: 78px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--ivory); padding: 7px 8px; font-size: 13.5px; text-align: right; font-variant-numeric: tabular-nums;
}
.fila-precio-input input:focus { outline: none; border-color: var(--gold); }
.unidad { font-size: 12px; }
.input-pin {
  width: 90px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--ivory); padding: 8px 10px; font-size: 15px; letter-spacing: 3px; text-align: center; font-variant-numeric: tabular-nums;
}
.input-pin:focus { outline: none; border-color: var(--gold); }
.agregar-material { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.agregar-material input {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--ivory); padding: 10px 11px; font-size: 13.5px;
}
.agregar-material input:first-child { flex: 1; min-width: 140px; }
.agregar-material input:nth-child(2) { width: 90px; }

.toggle-grupo { display: flex; gap: 8px; margin-bottom: 16px; }
.toggle-btn {
  flex: 1; padding: 10px; border-radius: var(--radius); border: 1px solid var(--border);
  background: var(--surface); color: var(--muted); font-size: 13.5px; font-weight: 500; cursor: pointer;
}
.toggle-btn.activo { border-color: var(--gold); color: var(--gold-bright); background: rgba(242,185,61,0.10); }

.selector-material { position: relative; }
.selector-material-boton {
  display: flex; align-items: center; gap: 10px; width: 100%;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--ivory); padding: 11px 12px; font-family: var(--font-body); font-size: 14.5px; cursor: pointer; text-align: left;
}
.selector-material-boton:hover { border-color: var(--border-strong); }
.selector-material-icono { font-size: 18px; flex-shrink: 0; line-height: 1; }
.selector-material-texto { flex: 1; }
.selector-material-chevron { color: var(--muted); font-size: 12px; }
.selector-material-lista { display: flex; flex-direction: column; }
.selector-material-item {
  display: flex; align-items: center; gap: 12px; width: 100%; background: none; border: none;
  border-top: 1px solid var(--border); padding: 13px 6px; cursor: pointer; text-align: left; color: var(--ivory);
  font-family: var(--font-body);
}
.selector-material-lista .selector-material-item:first-child { border-top: none; }
.selector-material-item:hover { background: var(--surface-2); }
.selector-material-item.seleccionado { background: rgba(242,185,61,0.08); }
.selector-material-item-texto { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 14.5px; }
.selector-material-item-precio { font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.selector-material-check { color: var(--gold); font-weight: 700; font-size: 16px; }
.bloque-roles { border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 14px 2px; margin-bottom: 16px; background: rgba(242,185,61,0.04); }
.bloque-roles .texto-ayuda { margin: -4px 0 12px; }
.bloque-monto { border: 1px solid var(--gold); border-radius: var(--radius); padding: 14px 14px 2px; margin-bottom: 16px; background: rgba(242,185,61,0.06); }
.bloque-monto .texto-ayuda { margin: -4px 0 12px; }
.categoria-fija {
  display: flex; align-items: center; gap: 10px; width: 100%;
  background: rgba(242,185,61,0.08); border: 1px dashed var(--gold); border-radius: var(--radius);
  color: var(--ivory); padding: 11px 12px; font-size: 14.5px;
}
.categoria-fija b { font-weight: 600; }
.categoria-fija i { font-style: normal; font-size: 11.5px; color: var(--muted); margin-left: auto; }

.interruptor-regalo {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 12px 14px; margin-bottom: 14px; cursor: pointer; font-family: var(--font-body); font-size: 14px; color: var(--ivory);
}
.interruptor-regalo.activo { border-color: var(--gold); background: rgba(242,185,61,0.08); }
.interruptor-regalo-switch {
  width: 40px; height: 24px; border-radius: 999px; background: var(--surface-3); position: relative; flex-shrink: 0;
  transition: background .15s ease;
}
.interruptor-regalo.activo .interruptor-regalo-switch { background: linear-gradient(135deg, var(--gold-bright), var(--gold)); }
.interruptor-regalo-bola {
  position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: var(--ivory);
  transition: transform .15s ease;
}
.interruptor-regalo.activo .interruptor-regalo-bola { transform: translateX(16px); background: var(--ink); }

.items-lista { display: flex; flex-direction: column; gap: 14px; margin-bottom: 8px; }
.item-venta { border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.item-venta-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 12.5px; color: var(--muted); font-weight: 600; }
.item-venta-ganancia { text-align: right; font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; margin-top: -4px; }

.resumen-texto {
  width: 100%; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--ivory); font-family: var(--font-body); font-size: 13px; line-height: 1.6; padding: 14px;
  white-space: pre-wrap; resize: none; margin-bottom: 14px;
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba(4,3,2,0.75);
  display: flex; align-items: flex-end; justify-content: center; z-index: 50; padding: 0;
}
.modal {
  background: var(--surface); border: 1px solid var(--border-strong); border-radius: 14px 14px 0 0;
  padding: 20px 18px 24px; width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto;
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h2 { font-family: var(--font-display); font-size: 19px; font-weight: 600; margin: 0; }
.resumen-calculo {
  display: flex; justify-content: space-between; border: 1px solid var(--border); border-radius: var(--radius);
  padding: 12px 14px; margin: 4px 0 14px; font-size: 12.5px;
}
.resumen-calculo > div { display: flex; flex-direction: column; gap: 3px; }
.resumen-calculo strong { font-size: 14.5px; font-variant-numeric: tabular-nums; }
.resumen-calculo span { color: var(--muted); }
.modal-acciones { display: flex; gap: 10px; margin-top: 6px; }
.modal-acciones .btn { flex: 1; }
.modal-pie {
  position: sticky; bottom: -24px; z-index: 3; margin: 10px -18px -24px; padding: 12px 18px 24px;
  background: var(--surface); border-top: 1px solid var(--border-strong);
}
.modal-pie .resumen-calculo { margin: 0 0 8px; padding: 9px 14px; }
.modal-pie .detalle-privado { margin: 0 0 8px; padding-top: 0; border-top: none; }
.modal-pie .error-texto { margin: 0 0 8px; }
.aviso-venta { margin: 0 0 8px; padding: 7px 10px; border-radius: 6px; font-size: 12px; line-height: 1.4; color: #FFD0CB; background: rgba(224,100,90,0.14); border: 1px solid rgba(224,100,90,0.45); }
.modal-pie .modal-acciones { margin-top: 0; }
.error-texto { color: var(--red); font-size: 12.5px; margin: -6px 0 12px; }

.toast {
  position: fixed; top: 14px; left: 50%; transform: translateX(-50%); max-width: calc(100vw - 32px); text-align: center;
  background: var(--surface-3); border: 1px solid var(--border-strong); color: var(--ivory);
  padding: 11px 18px; border-radius: 999px; font-size: 13px; z-index: 60;
}

/* ===== pestanas nuevas: Venta, Historial, Reportes, Graficos, Ajustes ===== */
a.btn { text-decoration: none; }
.icon-btn:disabled { opacity: 0.35; cursor: default; }
.icon-btn-activo { color: var(--gold-bright); border-color: var(--gold); background: var(--gold-tint); }

.venta-titulo { font-family: var(--font-display); font-size: 18px; font-weight: 600; margin: 0 0 14px; }
.venta-form--embebido .modal-pie { bottom: 58px; margin: 14px -16px 0; padding: 12px 16px; }
.interruptor-regalo-label { font-size: 14px; }

.resumen-detalle {
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--gold-tint);
  padding: 12px 14px 10px; margin: 4px 0 16px;
}
.resumen-detalle-titulo { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.resumen-detalle-titulo span { font-family: var(--font-display); font-size: 15px; font-weight: 600; }
.resumen-detalle-titulo i { font-style: normal; font-size: 11px; color: var(--muted); }
.resumen-detalle h4 { font-size: 12px; font-weight: 600; color: var(--muted); margin: 12px 0 4px; }
.resumen-linea { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; padding: 4px 0; font-variant-numeric: tabular-nums; }
.resumen-linea b { font-weight: 600; white-space: nowrap; }
.resumen-vacio { color: var(--muted); font-size: 12.5px; margin: 0 0 2px; }
.resumen-total { border-top: 1px solid var(--border-strong); margin-top: 8px; padding-top: 8px; font-weight: 600; }

.modal-acciones-envolver { flex-wrap: wrap; }
.modal-acciones-envolver .btn { flex: 1 1 40%; }

/* historial */
.buscador { position: relative; margin-bottom: 10px; }
.buscador svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
.buscador input {
  width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--ivory); padding: 11px 12px 11px 36px; font-family: var(--font-body); font-size: 14.5px;
}
.buscador input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-tint-2); }
.filtros-select { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.filtros-select select {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--ivory);
  padding: 9px 8px; font-family: var(--font-body); font-size: 12.5px; width: 100%; min-width: 0;
}
.filtros-select select:focus { outline: none; border-color: var(--gold); }
.historial-resumen-fila { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 2px 0 8px; }
.historial-resumen { font-size: 12.5px; color: var(--muted); margin: 0; font-variant-numeric: tabular-nums; }
.grupo-dia { margin-bottom: 10px; }
.grupo-dia-cabeza {
  display: flex; justify-content: space-between; align-items: baseline; padding: 8px 0 6px;
  border-bottom: 1px solid var(--border-strong); font-size: 12.5px; font-weight: 600; color: var(--gold-bright);
  font-variant-numeric: tabular-nums; text-transform: capitalize;
}
.grupo-dia .lista-ventas { margin-top: 0; }

/* tarjeta de venta */
.venta-hora { font-size: 12px; color: var(--muted); white-space: nowrap; padding-top: 2px; text-transform: capitalize; }
.chips-items { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip-item {
  display: inline-flex; align-items: center; gap: 5px; font-size: 12px; background: var(--surface-2);
  border: 1px solid var(--border); border-radius: 999px; padding: 4px 10px;
}
.chip-item em { font-style: normal; color: var(--muted); font-variant-numeric: tabular-nums; }
.chip-regalo { border-style: dashed; border-color: var(--gold); }
.roles-fila { display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 10px; }
.rol-chip { display: inline-flex; align-items: center; gap: 7px; }
.rol-avatar {
  width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  font-size: 11.5px; font-weight: 700; color: #0B0B0D; flex-shrink: 0;
}
.rol-texto { display: flex; flex-direction: column; line-height: 1.2; }
.rol-texto i { font-style: normal; font-size: 10.5px; color: var(--muted); }
.rol-texto span { font-size: 12.5px; font-weight: 500; }
.venta-total-fila { display: flex; gap: 10px; margin-top: 10px; }
.venta-total-bloque, .venta-ganancia-bloque {
  flex: 1; background: var(--surface-2); border-radius: var(--radius); padding: 9px 12px;
  display: flex; flex-direction: column; gap: 2px;
}
.venta-total-label { font-size: 11px; color: var(--muted); }
.venta-total { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
.venta-ganancia-bloque .venta-ganancia { font-size: 17px; font-weight: 700; }
.venta-total-sub { font-size: 11px; color: var(--muted); }

/* reportes y graficos */
.navegador-periodo { display: flex; justify-content: space-between; align-items: center; margin: 0 0 14px; }
.navegador-periodo strong { font-family: var(--font-display); font-size: 15px; font-weight: 600; text-transform: capitalize; text-align: center; }
.stat-delta { font-size: 11.5px; font-weight: 600; font-variant-numeric: tabular-nums; }
.stat-sub { font-size: 11.5px; color: var(--muted); }
.tarjeta { border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 16px; background: var(--surface); }
.tarjeta-cabeza { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 12px 14px 0; }
.tarjeta-cabeza h3 { font-family: var(--font-display); font-size: 15px; font-weight: 600; margin: 0; }
.tarjeta-cabeza span { font-size: 11.5px; color: var(--muted); text-align: right; }
.tarjeta-cuerpo { padding: 12px 14px 14px; }
.inteligencia { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.inteligencia-item { background: var(--surface-2); border-radius: var(--radius); padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.inteligencia-item span { font-size: 11.5px; color: var(--muted); }
.inteligencia-item b { font-size: 15px; font-weight: 600; overflow-wrap: anywhere; }
.inteligencia-item small { font-size: 11.5px; color: var(--gold-bright); }
.ranking { display: flex; flex-direction: column; gap: 13px; }
.ranking-cabeza { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 13px; margin-bottom: 5px; font-variant-numeric: tabular-nums; }
.ranking-cabeza b { font-weight: 600; }
.ranking-cabeza span { color: var(--muted); font-size: 12.5px; text-align: right; }
.ranking-barra { height: 7px; background: var(--surface-3); border-radius: 999px; overflow: hidden; }
.ranking-barra > div { height: 100%; border-radius: 999px; }
.ranking-sub { font-size: 11.5px; color: var(--muted); margin-top: 4px; }
.mini-titulo { font-size: 12.5px; font-weight: 600; color: var(--muted); margin: 14px 0 8px; }
.mini-titulo:first-child { margin-top: 0; }
.barra-patron { display: grid; grid-template-columns: 62px 1fr 64px; align-items: center; gap: 10px; font-size: 12.5px; padding: 3px 0; }
.barra-patron b { font-weight: 500; text-transform: capitalize; }
.barra-patron span { text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; }

.tabla-comparativa { overflow-x: auto; }
.tc-fila {
  display: grid; grid-template-columns: minmax(0, 1.8fr) 0.6fr 0.85fr 0.85fr 1.2fr; gap: 6px; align-items: center;
  padding: 8px 0; border-top: 1px solid var(--border); font-size: 12px; font-variant-numeric: tabular-nums; min-width: 300px;
}
.tc-fila > :not(:first-child) { text-align: right; }
.tc-cabeza { border-top: none; padding-top: 0; padding-bottom: 6px; }
.tc-producto { font-size: 12.5px; overflow-wrap: anywhere; }
.tc-total { border-top: 1px solid var(--border-strong); font-weight: 600; }
.th { background: none; border: none; padding: 0; color: var(--muted); font-family: var(--font-body); font-size: 11px; font-weight: 600; cursor: pointer; text-align: inherit; }
.th:hover { color: var(--ivory); }
.th-activo { color: var(--gold-bright); }

.acordeon { border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 16px; background: var(--surface); }
.acordeon-cabeza { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 12px; flex-wrap: wrap; }
.acordeon-titulo { font-family: var(--font-display); font-size: 14px; font-weight: 600; }
.acordeon-acciones { display: flex; gap: 6px; }
.mini-btn {
  display: inline-flex; align-items: center; gap: 4px; background: var(--surface-2); border: 1px solid var(--border);
  border-radius: 6px; color: var(--ivory); font-family: var(--font-body); font-size: 12px; padding: 6px 10px; cursor: pointer;
}
.mini-btn:hover:not(:disabled) { border-color: var(--gold); }
.mini-btn:disabled { opacity: 0.4; cursor: default; }
.giro { transform: rotate(180deg); }
.lista-compacta { border-top: 1px solid var(--border); padding: 4px 12px 10px; }
.fila-compacta {
  display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; column-gap: 8px; row-gap: 1px; padding: 8px 0;
  border-top: 1px solid var(--border); font-size: 13px; align-items: baseline;
}
.fila-compacta:first-child { border-top: none; }
.fc-fecha { color: var(--muted); font-size: 12px; }
.fc-cliente { overflow-wrap: anywhere; }
.fc-monto { font-variant-numeric: tabular-nums; }
.fc-personas { grid-column: 2 / 4; font-size: 11.5px; color: var(--muted); }

/* ===== reparto, transferencias y ticket del costo ===== */
.liquidacion { margin-top: 10px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px 11px; }
.liq-titulo { font-size: 11.5px; font-weight: 600; color: var(--muted); margin-bottom: 4px; }
.liq-titulo-sep { margin-top: 10px; padding-top: 9px; border-top: 1px dashed var(--border-strong); }
.liq-fila { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 13px; padding: 3px 0; font-variant-numeric: tabular-nums; }
.liq-fila b { font-weight: 600; white-space: nowrap; }
.liq-transferir span::before { content: "→ "; color: var(--gold); }
.liq-ok { color: var(--green); }
.liq-ok span::before { color: var(--green); }
.liq-vacio { font-size: 12.5px; color: var(--muted); margin: 0 0 2px; line-height: 1.4; }
.ticket-franja { margin-top: 10px; border: 1px solid var(--border); border-radius: var(--radius); padding: 9px 12px; background: var(--surface-2); }
.ticket-franja.pendiente { border-color: rgba(242,185,61,0.6); background: rgba(242,185,61,0.09); }
.ticket-franja.ok { border-color: rgba(111,207,151,0.6); background: rgba(111,207,151,0.10); }
.tf-linea { display: flex; align-items: center; justify-content: space-between; gap: 8px 10px; flex-wrap: wrap; }
.tf-texto { display: flex; flex-direction: column; gap: 1px; font-size: 13.5px; min-width: 0; }
.tf-texto b { font-weight: 600; font-variant-numeric: tabular-nums; }
.tf-texto small { font-size: 12px; color: var(--muted); }
.tf-nota { font-size: 11.5px; color: var(--muted); margin-top: 5px; }
.tf-acciones { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.ticket-franja.pendiente .btn-confirmar { width: 100%; padding: 9px 12px; font-size: 13.5px; }
.ticket-chip { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 11px; font-size: 12px; font-weight: 600; }
.ticket-chip.pendiente { color: #F2B93D; background: rgba(242,185,61,0.12); border: 1px solid rgba(242,185,61,0.55); }
.ticket-chip.neutro { color: var(--muted); background: transparent; border: 1px solid var(--border-strong); font-weight: 500; }
.ticket-chip.ok { color: var(--green); background: rgba(111,207,151,0.14); border: 1px solid rgba(111,207,151,0.55); }
.btn-confirmar {
  background: linear-gradient(135deg, var(--gold-bright), var(--gold)); color: var(--ink); border: none; border-radius: 6px;
  padding: 7px 12px; font-family: var(--font-body); font-size: 12.5px; font-weight: 700; cursor: pointer;
}
.costos-pendientes { border: 1px solid rgba(242,185,61,0.55); background: rgba(242,185,61,0.07); border-radius: var(--radius); padding: 11px 12px 4px; margin-bottom: 14px; }
.costos-al-dia { border: 1px solid rgba(111,207,151,0.55); background: rgba(111,207,151,0.10); color: var(--green); border-radius: var(--radius); padding: 10px 12px; margin-bottom: 14px; font-size: 13.5px; font-weight: 600; }
.cp-cabeza { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 13.5px; margin-bottom: 6px; flex-wrap: wrap; }
.cp-cabeza span { color: var(--muted); font-size: 12.5px; font-variant-numeric: tabular-nums; }
.cp-fila { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px; padding: 7px 0; border-top: 1px solid var(--border); font-size: 13px; font-variant-numeric: tabular-nums; }
.cp-fila span:nth-child(2) { color: var(--muted); font-size: 12.5px; }
.confirmar-lote { margin-bottom: 14px; }
.confirmar-lote .btn-ancho { margin: 0; }
.confirmar-lote-caja { border: 1px solid var(--gold); border-radius: var(--radius); padding: 12px; background: var(--gold-tint); }
.confirmar-lote-caja p { font-size: 13px; margin: 0 0 10px; line-height: 1.4; }
.tab-icono { position: relative; display: inline-flex; }
.tab-badge {
  position: absolute; top: -6px; right: -13px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px;
  background: var(--red); color: #fff; font-size: 10.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;
}
.filtros-select select:last-child:nth-child(odd) { grid-column: 1 / -1; }

@media (max-width: 390px) {
  .encabezado { padding: 14px 12px 10px; }
  .marca-nombre { font-size: 15px; }
  .usuario-actual { gap: 6px; }
  .usuario-nombre { font-size: 12.5px; }
}

@media (min-width: 640px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
  .modal-overlay { align-items: center; }
  .modal { border-radius: 14px; }
}
`;

/* ---------- componentes pequenos ---------- */

function LoadingScreen() {
  return (
    <div className="pantalla-centrada">
      <p style={{ color: "var(--muted)" }}>Cargando...</p>
    </div>
  );
}

function ErrorScreen({ msg, onRetry }) {
  return (
    <div className="pantalla-centrada">
      <p className="error-texto">{msg}</p>
      <button className="btn btn-primario" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

function StatCard({ label, valor, destacar, sub, delta }) {
  return (
    <div className={`stat-card ${destacar ? "stat-destacar" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-valor">{valor}</span>
      {delta != null && (
        <span className={`stat-delta ${delta >= 0 ? "positivo" : "negativo"}`}>
          {delta >= 0 ? "↑" : "↓"}
          {Math.abs(delta)}% vs anterior
        </span>
      )}
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function Header({ usuario, esGerente, onLogout, onAjustes, ajustesActivo }) {
  return (
    <header className="encabezado">
      <div className="marca">
        <span className="marca-nombre">Joyería Contabilidad</span>
        <span className="marca-sub">Registro de ventas</span>
      </div>
      <div className="usuario-actual">
        <div className="usuario-info">
          <span className="usuario-nombre">{usuario}</span>
          <span className="usuario-rol">{esGerente ? "Gerente" : "Vendedor"}</span>
        </div>
        {esGerente && (
          <button
            className={`icon-btn ${ajustesActivo ? "icon-btn-activo" : ""}`}
            onClick={onAjustes}
            aria-label="Ajustes"
            title="Precios, Costo real, Lotes y Equipo"
          >
            <Settings size={17} />
          </button>
        )}
        <button className="icon-btn" onClick={onLogout} aria-label="Cerrar sesion">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

function LoginScreen({ personas, pins, onLogin }) {
  const [seleccion, setSeleccion] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  function elegir(nombre) {
    setSeleccion(nombre);
    setPin("");
    setErr("");
  }

  function ingresar() {
    if (pin === (pins[seleccion] || "")) {
      onLogin(seleccion);
    } else {
      setErr("PIN incorrecto.");
      setPin("");
    }
  }

  return (
    <div className="login-pantalla">
      <div className="login-marca">
        <span className="login-marca-nombre">Joyería Contabilidad</span>
        <span className="login-marca-sub">Registro de ventas</span>
      </div>

      {!seleccion ? (
        <div className="login-lista">
          {personas.map((nombre) => (
            <button key={nombre} className="login-item" onClick={() => elegir(nombre)}>
              {nombre}
            </button>
          ))}
        </div>
      ) : (
        <div className="login-pin">
          <p className="login-pin-nombre">{seleccion}</p>
          <input
            className="login-pin-input"
            type="text"
            inputMode="numeric"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setErr("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") ingresar();
            }}
            placeholder="****"
          />
          {err && <p className="error-texto">{err}</p>}
          <div className="login-pin-acciones">
            <button className="btn btn-secundario" onClick={() => setSeleccion(null)}>
              Volver
            </button>
            <button className="btn btn-primario" onClick={ingresar}>
              Ingresar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- fila de venta ---------- */

function RolChip({ rol, nombre }) {
  return (
    <span className="rol-chip">
      <b className="rol-avatar" style={{ background: colorDe(nombre) }}>
        {inicialDe(nombre)}
      </b>
      <span className="rol-texto">
        <i>{rol}</i>
        <span>{nombre}</span>
      </span>
    </span>
  );
}

function BloqueLiquidacion({ venta, liq }) {
  const l = liq || calcularLiquidacion(venta);
  const confirmado = !!venta && ticketConfirmado(venta);
  return (
    <div className="liquidacion">
      <div className="liq-titulo">Reparto de ganancia</div>
      {l.partes.map((pt) => (
        <div key={pt.nombre} className="liq-fila">
          <span>
            {pt.nombre} {l.pct}%
          </span>
          <b>{formatCLP(pt.monto)}</b>
        </div>
      ))}

      <div className="liq-titulo liq-titulo-sep">{l.pagador ? `Transferencias · las hace ${l.pagador}` : "Transferencias"}</div>
      {!l.pagador && <p className="liq-vacio">Falta anotar a quién le pagaron (edita la venta).</p>}
      {l.pagador && l.transferencias.length === 0 && <p className="liq-vacio">No hay transferencias por hacer.</p>}
      {!venta && l.pagador === GERENTE && l.costo > 0 && <p className="liq-vacio">El costo no se transfiere: {GERENTE} recibió el pago.</p>}
      {l.transferencias.map((t) => (
        <div key={t.tipo + t.a} className={`liq-fila liq-transferir ${t.tipo === "costo" && confirmado ? "liq-ok" : ""}`}>
          <span>
            Transferir {t.desc} a {t.a}
            {t.tipo === "costo" && confirmado ? " ✓" : ""}
          </span>
          <b>{formatCLP(t.monto)}</b>
        </div>
      ))}
    </div>
  );
}

/* Franja del costo y su ticket: sale en TODAS las ventas del Historial.
   Todos los costos van a Joyas Pikete (el gerente tiene la mercaderia). Si el pago lo recibio otra persona,
   esa persona transfiere el costo y el gerente confirma el ticket. */
function FranjaTicket({ venta, puedeConfirmar, onConfirmar, onQuitar }) {
  const costo = Math.round(venta.costoTotal || 0);
  if (costo <= 0) return null;
  const pagador = venta.pagadoA || "";
  if (!pagador) {
    return (
      <div className="ticket-franja neutro">
        <div className="tf-linea">
          <span className="tf-texto">
            <b>Costo {formatCLP(costo)}</b>
            <small>Falta anotar a quién le pagaron</small>
          </span>
        </div>
      </div>
    );
  }
  if (pagador === GERENTE) {
    return (
      <div className="ticket-franja pikete">
        <div className="tf-linea">
          <span className="tf-texto">
            <b>Costo {formatCLP(costo)}</b>
            <small>Ya está en {GERENTE} (él recibió el pago)</small>
          </span>
          <span className="ticket-chip neutro">Sin transferencia ✓</span>
        </div>
      </div>
    );
  }
  const confirmado = ticketConfirmado(venta);
  return (
    <div className={`ticket-franja ${confirmado ? "ok" : "pendiente"}`}>
      <div className="tf-linea">
        <span className="tf-texto">
          <b>Costo {formatCLP(costo)}</b>
          <small>
            {pagador} {confirmado ? "transfirió" : "transfiere"} a {GERENTE}
          </small>
        </span>
        <span className={`ticket-chip ${confirmado ? "ok" : "pendiente"}`}>
          {confirmado ? "Transferido ✓ Ticket" : "Sin ticket · por confirmar"}
        </span>
      </div>
      {confirmado && venta.ticketCosto.fecha && (
        <div className="tf-nota">Ticket confirmado el {formatFechaCorta(venta.ticketCosto.fecha.slice(0, 10))}.</div>
      )}
      {puedeConfirmar && (
        <div className="tf-acciones">
          {!confirmado ? (
            <button type="button" className="btn-confirmar" onClick={onConfirmar}>
              Confirmar transferencia
            </button>
          ) : (
            <button type="button" className="link-btn" onClick={onQuitar}>
              Quitar ticket
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function VentaFila({ venta, onEditar, onDuplicar, onEliminar, onResumen, comisiones, costosReales, comisionDe, puedeEditar = true, ocultarDia = false, puedeConfirmarTicket = false, onConfirmarTicket, onQuitarTicket }) {
  const [confirmar, setConfirmar] = useState(false);
  const items = (venta.items || []).map(normalizarItem);
  const tieneRegalo = items.some((it) => it.esRegalo);
  const hora = horaDeVenta(venta);
  const gramos = gramosDeVenta(venta);
  const agendo = venta.vendedor;
  const atendio = venta.atendidoPor || venta.vendedor;

  function chipDe(it) {
    if (it.tipo === "lote") {
      const n = Object.keys(it.pesosLote || {}).length;
      return {
        icono: "📦",
        nombre: it.nombreLote || `Lote (${n} ${n === 1 ? "categoria" : "categorias"})`,
        detalle: formatGramos(gramosDeVenta({ items: [it] })),
        precio: !venta.ventaPorTotal && !it.esRegalo ? formatCLP(it.precioVenta) : "",
      };
    }
    if (it.tipo === "insumo") {
      return { icono: "🧰", nombre: it.material, detalle: it.cantidad > 1 ? `x${it.cantidad}` : "", precio: "" };
    }
    return { icono: iconoMaterial(it.material), nombre: it.material, detalle: formatGramos(it.gramos), precio: "" };
  }

  // Un vendedor ve solo su propia comision; el administrador ve las de ambos.
  const verComision = (nombre) => !comisionDe || comisionDe === nombre;
  const comisionVendedor = verComision(agendo) ? calcularComisionVenta(venta, agendo, comisiones) : 0;
  const comisionAtendidoPor =
    venta.compartida && verComision(venta.atendidoPor) ? calcularComisionVenta(venta, venta.atendidoPor, comisiones) : 0;
  const detReal = costosReales ? detalleGananciaReal(venta, costosReales, comisiones) : null;

  return (
    <div className="venta-fila">
      <div className="venta-fila-principal">
        <div className="venta-material">{venta.cliente || "Sin nombre"}</div>
        <div className="venta-hora">
          {ocultarDia ? hora : etiquetaDia(venta.fecha) + (hora ? ` · ${hora}` : "")}
        </div>
      </div>

      <div className="chips-items">
        {items.map((it, i) => {
          const c = chipDe(it);
          return (
            <span key={it.id || i} className={`chip-item ${it.esRegalo ? "chip-regalo" : ""}`}>
              {it.esRegalo ? "🎁" : c.icono} {c.nombre}
              {c.detalle && <em>{c.detalle}</em>}
              {c.precio && <em>{c.precio}</em>}
            </span>
          );
        })}
      </div>

      <div className="roles-fila">
        <RolChip rol="Agendó" nombre={agendo} />
        <RolChip rol="Atendió" nombre={atendio} />
        {venta.pagadoA && <RolChip rol="Pagó a" nombre={venta.pagadoA} />}
      </div>

      <FranjaTicket venta={venta} puedeConfirmar={puedeConfirmarTicket} onConfirmar={onConfirmarTicket} onQuitar={onQuitarTicket} />

      <div className="venta-total-fila">
        <div className="venta-total-bloque">
          <span className="venta-total-label">Venta</span>
          <span className="venta-total">{formatCLP(venta.precioVentaTotal)}</span>
          {gramos > 0 && <span className="venta-total-sub">{formatGramos(gramos)} en total</span>}
        </div>
        <div className={`venta-ganancia-bloque ${venta.gananciaTotal >= 0 ? "positivo" : "negativo"}`}>
          <span className="venta-total-label">Ganancia</span>
          <span className="venta-ganancia">{formatCLP(venta.gananciaTotal)}</span>
        </div>
      </div>

      <BloqueLiquidacion venta={venta} />

      <div className="venta-fila-detalle">
        <span>Costo {formatCLP(venta.costoTotal)}</span>
        <span>{venta.canal === "online" ? "Online" : "Presencial"}</span>
        {venta.ventaPorTotal && <span>Monto total</span>}
        {comisionVendedor > 0 && <span>Comision {agendo}: {formatCLP(comisionVendedor)}</span>}
        {comisionAtendidoPor > 0 && <span>Comision {venta.atendidoPor}: {formatCLP(comisionAtendidoPor)}</span>}
        {tieneRegalo && <span>🎁 Incluye regalo</span>}
      </div>
      {venta.notas && <div className="venta-notas">{venta.notas}</div>}
      {detReal && (
        <div className="detalle-privado">
          <Lock size={12} />
          <span>Costo real {formatCLP(detReal.costoReal)}</span>
          <span className={detReal.total >= 0 ? "positivo" : "negativo"}>Mi ganancia real {formatCLP(detReal.total)}</span>
          <small className="desglose-real">
            <TextoDesgloseReal costoCobrado={venta.costoTotal || 0} d={detReal} />
          </small>
        </div>
      )}
      <div className="venta-fila-acciones">
        {puedeEditar && (
          <button className="link-btn" onClick={onEditar}>
            <Pencil size={13} /> Editar
          </button>
        )}
        {puedeEditar && onDuplicar && (
          <button className="link-btn" onClick={onDuplicar}>
            <Copy size={13} /> Duplicar
          </button>
        )}
        <button className="link-btn" onClick={onResumen}>
          <Send size={13} /> Resumen
        </button>
        {!puedeEditar ? null : !confirmar ? (
          <button className="link-btn link-peligro" onClick={() => setConfirmar(true)}>
            <Trash2 size={13} /> Eliminar
          </button>
        ) : (
          <span className="confirmar-eliminar">
            ¿Eliminar?
            <button className="link-btn link-peligro" onClick={onEliminar}>
              Sí
            </button>
            <button className="link-btn" onClick={() => setConfirmar(false)}>
              No
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- selector de categoria con iconos (materiales + insumos + lotes) ---------- */

function SelectorCategoria({ item, onSeleccionar, materiales, precios }) {
  const [abierto, setAbierto] = useState(false);

  const actual =
    item.tipo === "insumo"
      ? { icono: "🧰", nombre: "Insumos" }
      : item.tipo === "lote"
      ? { icono: "📦", nombre: "Lotes" }
      : { icono: iconoMaterial(item.material), nombre: item.material || "Selecciona" };

  function elegir(cambios) {
    onSeleccionar(cambios);
    setAbierto(false);
  }

  return (
    <div className="selector-material">
      <button type="button" className="selector-material-boton" onClick={() => setAbierto(true)}>
        <span className="selector-material-icono">{actual.icono}</span>
        <span className="selector-material-texto">{actual.nombre}</span>
        <span className="selector-material-chevron">▾</span>
      </button>
      {abierto && (
        <div className="modal-overlay" onClick={() => setAbierto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Categoria</h2>
              <button type="button" className="icon-btn" onClick={() => setAbierto(false)} aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>
            <div className="selector-material-lista">
              {materiales.map((m) => (
                <button
                  type="button"
                  key={m}
                  className={`selector-material-item ${item.tipo === "por_gramo" && item.material === m ? "seleccionado" : ""}`}
                  onClick={() => elegir({ tipo: "por_gramo", material: m })}
                >
                  <span className="selector-material-icono">{iconoMaterial(m)}</span>
                  <span className="selector-material-item-texto">
                    <span>{m}</span>
                    <span className="selector-material-item-precio">{formatCLP(precios[m])}/g</span>
                  </span>
                  {item.tipo === "por_gramo" && item.material === m && <span className="selector-material-check">✓</span>}
                </button>
              ))}
              <button
                type="button"
                className={`selector-material-item ${item.tipo === "insumo" ? "seleccionado" : ""}`}
                onClick={() => elegir({ tipo: "insumo" })}
              >
                <span className="selector-material-icono">🧰</span>
                <span className="selector-material-item-texto">
                  <span>Insumos</span>
                </span>
                {item.tipo === "insumo" && <span className="selector-material-check">✓</span>}
              </button>
              <button
                type="button"
                className={`selector-material-item ${item.tipo === "lote" ? "seleccionado" : ""}`}
                onClick={() => elegir({ tipo: "lote" })}
              >
                <span className="selector-material-icono">📦</span>
                <span className="selector-material-item-texto">
                  <span>Lotes</span>
                </span>
                {item.tipo === "lote" && <span className="selector-material-check">✓</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InterruptorRegalo({ activo, onChange }) {
  return (
    <button type="button" className={`interruptor-regalo ${activo ? "activo" : ""}`} onClick={() => onChange(!activo)}>
      <span className="interruptor-regalo-label">🎁 Marcar como regalo</span>
      <span className="interruptor-regalo-switch">
        <span className="interruptor-regalo-bola" />
      </span>
    </button>
  );
}

/* ---------- modal de venta (nueva / editar) ---------- */

// Campo de dinero a la chilena: se escribe 100000 o 100.000 y se ve 100.000.
// Los puntos son separador de miles (no decimales); el estado guarda solo los digitos ("100000").
function formatoMiles(valor) {
  const s = String(valor == null ? "" : valor);
  if (s === "") return "";
  const [entero, dec] = s.split(".");
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dec ? `${miles},${dec}` : miles;
}

function InputDinero({ value, onChange, ...resto }) {
  const ref = useRef(null);
  const caret = useRef(null);

  function alCambiar(e) {
    const crudo = e.target.value;
    const pos = e.target.selectionStart == null ? crudo.length : e.target.selectionStart;
    caret.current = crudo.slice(0, pos).replace(/\D/g, "").length;
    onChange(crudo.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
  }

  // Mantiene el cursor en su sitio aunque se re-formateen los puntos.
  useLayoutEffect(() => {
    if (caret.current == null || !ref.current) return;
    let n = caret.current;
    const txt = ref.current.value;
    let i = 0;
    for (; i < txt.length && n > 0; i++) if (/\d/.test(txt[i])) n--;
    caret.current = null;
    if (document.activeElement === ref.current) ref.current.setSelectionRange(i, i);
  });

  return (
    <input
      {...resto}
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatoMiles(value)}
      onChange={alCambiar}
    />
  );
}

function ListaPersonas({ personas, valor, onCambio, conVacio }) {
  return (
    <select value={valor} onChange={(e) => onCambio(e.target.value)}>
      {conVacio && <option value="">Selecciona...</option>}
      {personas.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}

function VentaForm({ mode, data, usuario, esGerente, precios, personas, costosReales, comisiones, embebido = false, onCerrar, onLimpiar, onGuardar }) {
  const materiales = Object.keys(precios);

  const canalInicial = (data && data.canal) || "presencial";
  const [canal, setCanal] = useState(canalInicial);
  // A quien le pago el cliente / quien atendio / quien agendo (por defecto, quien registra la venta)
  const [pagadoA, setPagadoA] = useState(data ? data.pagadoA || "" : usuario);
  const [atendio, setAtendio] = useState((data && (data.atendidoPor || data.vendedor)) || usuario);
  const [agendo, setAgendo] = useState((data && data.vendedor) || usuario);
  const [cliente, setCliente] = useState((data && data.cliente) || "");
  const [fecha, setFecha] = useState((data && data.fecha) || todayISO());
  const [notas, setNotas] = useState((data && data.notas) || "");
  // Monto total de la venta (opcional): si se llena, los productos no llevan precio propio.
  const [montoTotal, setMontoTotal] = useState(data && data.ventaPorTotal ? String(data.precioVentaTotal || 0) : "");
  const [items, setItems] = useState(
    data && data.items && data.items.length
      ? data.items.map((it) => {
          const f = itemAFormulario(it, materiales);
          return data.ventaPorTotal ? { ...f, precioVenta: "", precioGramoVenta: "" } : f;
        })
      : [nuevoItemVacio(materiales, canalInicial === "online" ? "lote" : "por_gramo")]
  );
  const [err, setErr] = useState("");

  // Si quien atendio y quien agendo son personas distintas, la ganancia se reparte 50% / 50%.
  const compartida = atendio !== agendo;
  const hayMonto = montoTotal.trim() !== "";
  const montoNum = parseFloat(montoTotal) || 0;

  function itemSinDatos(it) {
    const sinPesos = !Object.values(it.pesosLote || {}).some((v) => parseFloat(v) > 0);
    return sinPesos && !it.gramos && !it.insumoNombre && !it.costoInsumo && !it.precioVenta && !it.precioGramoVenta;
  }

  // Online: el primer producto (si esta vacio) pasa solo a la categoria Lotes.
  // Presencial: ese primer producto, si sigue vacio, vuelve a la categoria normal (Lotes sigue en el listado).
  // Un producto con datos nunca se borra al cambiar de canal.
  function cambiarCanal(nuevo) {
    if (nuevo === canal) return;
    setCanal(nuevo);
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== 0 || !itemSinDatos(it)) return it;
        if (nuevo === "online" && it.tipo !== "lote") {
          return { ...nuevoItemVacio(materiales, "lote"), id: it.id, esRegalo: it.esRegalo };
        }
        if (nuevo === "presencial" && it.tipo === "lote") {
          return { ...nuevoItemVacio(materiales, "por_gramo"), id: it.id, esRegalo: it.esRegalo };
        }
        return it;
      })
    );
  }

  function actualizarItem(id, cambios) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...cambios } : it)));
  }
  // Online: el producto extra suele ser un insumo que va incluido en el lote.
  function agregarItem() {
    setItems((prev) => [...prev, nuevoItemVacio(materiales, canal === "online" ? "insumo" : "por_gramo")]);
  }
  function quitarItem(id) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }

  const itemsCalculados = items.map((it) => {
    const calc = calcularItem(it, precios);
    // Con monto total, cada producto solo aporta su costo; el precio es el de toda la venta.
    return { ...it, calc: hayMonto ? { ...calc, precioVenta: 0, ganancia: -calc.costo } : calc };
  });
  const costoTotal = itemsCalculados.reduce((a, it) => a + it.calc.costo, 0);
  const precioVentaTotal = hayMonto ? montoNum : itemsCalculados.reduce((a, it) => a + it.calc.precioVenta, 0);
  const gananciaTotal = precioVentaTotal - costoTotal;

  // Solo el administrador ve el costo real (y la ganancia real) mientras arma la venta.
  let costoRealTotal = null;
  if (esGerente && costosReales) {
    const itemsReales = itemsCalculados.map((it) => {
      if (it.tipo === "lote") return { tipo: "lote", pesosLote: it.pesosLote };
      if (it.tipo === "por_gramo") return { tipo: "por_gramo", material: it.material, gramos: parseFloat(it.gramos) || 0 };
      return { tipo: "insumo", costo: it.calc.costo };
    });
    costoRealTotal = calcularCostoRealVenta({ items: itemsReales }, costosReales);
  }
  const detRealForm =
    costoRealTotal == null
      ? null
      : detalleGananciaReal(
          { vendedor: agendo, atendidoPor: atendio, compartida, costoTotal, gananciaTotal },
          costosReales,
          comisiones,
          costoRealTotal
        );

  function validar() {
    for (const it of items) {
      if (it.tipo === "por_gramo") {
        if (!it.material) return "Selecciona una categoria en cada producto.";
        if (!it.gramos || parseFloat(it.gramos) <= 0) return "Ingresa los gramos en cada producto.";
      } else if (it.tipo === "insumo") {
        if (!it.insumoNombre.trim()) return "Escribe el nombre de cada insumo.";
        if (it.costoInsumo === "" || parseFloat(it.costoInsumo) < 0) return "Ingresa el costo de cada insumo.";
        if (!it.cantidad || parseFloat(it.cantidad) <= 0) return "Ingresa la cantidad de cada insumo.";
      } else if (it.tipo === "lote") {
        const pesoLote = Object.values(it.pesosLote || {}).reduce((a, v) => a + (parseFloat(v) || 0), 0);
        if (pesoLote <= 0) return "Ingresa el gramaje de al menos una categoria en el lote.";
      }
      if (!hayMonto && !it.esRegalo) {
        if (it.tipo === "por_gramo") {
          if (it.precioGramoVenta === "" || parseFloat(it.precioGramoVenta) < 0) {
            return "Ingresa el precio de venta por gramo de cada producto, o el monto total de la venta.";
          }
        } else if (it.precioVenta === "" || parseFloat(it.precioVenta) < 0) {
          return "Ingresa el precio de venta de cada producto, o el monto total de la venta.";
        }
      }
    }
    if (hayMonto && !(parseFloat(montoTotal) >= 0)) return "El monto total de la venta no es válido.";
    if (!fecha) return "Selecciona la fecha.";
    if (!pagadoA) return "Selecciona a quién le pagó el cliente.";
    if (!atendio) return "Selecciona quién atendió al cliente.";
    if (!agendo) return "Selecciona quién agendó al cliente.";
    if (!esGerente && usuario !== atendio && usuario !== agendo) {
      return "Tú debes ser quien atendió o quien agendó al cliente.";
    }
    return "";
  }

  function guardar() {
    const problema = validar();
    if (problema) {
      setErr(problema);
      return;
    }
    const itemsFinal = itemsCalculados.map((it) => {
      const base = {
        id: it.id,
        tipo: it.tipo,
        esRegalo: it.esRegalo,
        costo: Math.round(it.calc.costo),
        precioVenta: Math.round(it.calc.precioVenta),
      };
      if (it.tipo === "lote") {
        const pesosFinal = {};
        Object.entries(it.pesosLote || {}).forEach(([m, v]) => {
          const num = parseFloat(v) || 0;
          if (num > 0) pesosFinal[m] = num;
        });
        return { ...base, material: "Lote", nombreLote: (it.nombreLote || "").trim(), pesosLote: pesosFinal };
      }
      if (it.tipo === "insumo") {
        return { ...base, material: it.insumoNombre.trim(), cantidad: parseFloat(it.cantidad) || 1 };
      }
      return {
        ...base,
        material: it.material,
        gramos: parseFloat(it.gramos),
        precioGramo: it.calc.precioGramo,
        precioGramoVenta: it.calc.usaPrecioGramo && !it.esRegalo && !hayMonto ? parseFloat(it.precioGramoVenta) || 0 : null,
      };
    });
    const venta = {
      id: (data && data.id) || uid(),
      vendedor: agendo,
      atendidoPor: atendio,
      compartida,
      pagadoA,
      canal,
      cliente: cliente.trim(),
      fecha,
      items: itemsFinal,
      ventaPorTotal: hayMonto,
      costoTotal: Math.round(costoTotal),
      precioVentaTotal: Math.round(precioVentaTotal),
      gananciaTotal: Math.round(gananciaTotal),
      notas: notas.trim(),
      timestamp: (data && data.timestamp) || new Date().toISOString(),
    };
    // El ticket del costo se mantiene al editar solo si no cambio el costo ni quien recibio el pago.
    if (
      mode === "editar" &&
      data &&
      data.ticketCosto &&
      data.pagadoA === pagadoA &&
      Math.round(data.costoTotal || 0) === Math.round(costoTotal)
    ) {
      venta.ticketCosto = data.ticketCosto;
    }
    onGuardar(venta);
  }

  // Resumen automatico: gramos por categoria e insumos de esta venta.
  const gramosVendidos = {};
  const gramosRegalados = {};
  const insumosLista = [];
  itemsCalculados.forEach((it) => {
    const destino = it.esRegalo ? gramosRegalados : gramosVendidos;
    if (it.tipo === "por_gramo") {
      const g = parseFloat(it.gramos) || 0;
      if (g > 0) destino[it.material] = (destino[it.material] || 0) + g;
    } else if (it.tipo === "lote") {
      Object.entries(it.pesosLote || {}).forEach(([m, v]) => {
        const g = parseFloat(v) || 0;
        if (g > 0) destino[m] = (destino[m] || 0) + g;
      });
    } else if (it.insumoNombre.trim()) {
      insumosLista.push({
        nombre: it.insumoNombre.trim(),
        cantidad: parseFloat(it.cantidad) || 1,
        costo: it.calc.costo,
        esRegalo: it.esRegalo,
      });
    }
  });
  const pesoTotalVenta = [...Object.values(gramosVendidos), ...Object.values(gramosRegalados)].reduce((a, g) => a + g, 0);

  const encabezado = embebido ? (
    <h2 className="venta-titulo">Detalles de venta</h2>
  ) : (
    <div className="modal-header">
      <h2>{mode === "editar" ? "Editar venta" : mode === "duplicar" ? "Duplicar venta" : "Nueva venta"}</h2>
      <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar">
        <X size={17} />
      </button>
    </div>
  );

  const cuerpo = (
      <div className={`venta-form ${embebido ? "venta-form--embebido" : ""}`}>
        {encabezado}

        <div className="toggle-grupo">
          <button
            type="button"
            className={`toggle-btn ${canal === "presencial" ? "activo" : ""}`}
            onClick={() => cambiarCanal("presencial")}
          >
            Presencial
          </button>
          <button
            type="button"
            className={`toggle-btn ${canal === "online" ? "activo" : ""}`}
            onClick={() => cambiarCanal("online")}
          >
            Online
          </button>
        </div>

        {canal === "online" && (
          <p className="texto-ayuda">
            Venta Online: el primer producto parte en Lotes. Si el lote lleva un insumo incluido, agrégalo con «Agregar
            otro producto».
          </p>
        )}

        <div className="bloque-roles">
          <label className="campo">
            <span>A quién le pagó</span>
            <ListaPersonas personas={personas} valor={pagadoA} onCambio={setPagadoA} conVacio={!pagadoA} />
          </label>
          <label className="campo">
            <span>Atendió</span>
            <ListaPersonas personas={personas} valor={atendio} onCambio={setAtendio} />
          </label>
          <label className="campo">
            <span>Agendó</span>
            <ListaPersonas personas={personas} valor={agendo} onCambio={setAgendo} />
          </label>
          {compartida ? (
            <p className="texto-ayuda">Atendió y Agendó son distintos: la ganancia se reparte 50% / 50%.</p>
          ) : (
            <p className="texto-ayuda">{atendio} atendió y agendó: se lleva el 100% de la ganancia.</p>
          )}
        </div>

        <label className="campo">
          <span>Cliente (opcional)</span>
          <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" />
        </label>

        <label className="campo">
          <span>Fecha</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>

        <div className="bloque-monto">
          <label className="campo">
            <span>Monto total de la venta (opcional)</span>
            <InputDinero value={montoTotal} onChange={setMontoTotal} placeholder="Ej: 100.000" />
          </label>
        </div>

        <div className="items-lista">
          {itemsCalculados.map((it, idx) => (
            <div key={it.id} className="item-venta">
              <div className="item-venta-header">
                <span>Producto {idx + 1}</span>
                {items.length > 1 && (
                  <button type="button" className="icon-btn" onClick={() => quitarItem(it.id)} aria-label="Quitar producto">
                    <X size={14} />
                  </button>
                )}
              </div>

              {canal === "online" && idx === 0 && it.tipo === "lote" ? (
                <div className="campo">
                  <span>Categoria</span>
                  <div className="categoria-fija">
                    <b className="selector-material-icono">📦</b>
                    <b>Lotes</b>
                    <i>automática en ventas Online</i>
                  </div>
                </div>
              ) : (
                <div className="campo">
                  <span>Categoria</span>
                  <SelectorCategoria
                    item={it}
                    materiales={materiales}
                    precios={precios}
                    onSeleccionar={(cambios) => actualizarItem(it.id, cambios)}
                  />
                </div>
              )}

              {it.tipo === "por_gramo" && (
                <label className="campo">
                  <span>{it.esRegalo ? "Gramos regalados" : "Gramos vendidos"}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={it.gramos}
                    onChange={(e) => actualizarItem(it.id, { gramos: e.target.value })}
                    placeholder="0.00"
                  />
                </label>
              )}

              {it.tipo === "insumo" && (
                <>
                  <label className="campo">
                    <span>Nombre del insumo</span>
                    <input
                      type="text"
                      value={it.insumoNombre}
                      onChange={(e) => actualizarItem(it.id, { insumoNombre: e.target.value })}
                      placeholder="Ej: broche, cierre, caja"
                    />
                  </label>
                  <div className="campos-fila">
                    <label className="campo campo-inline">
                      <span>Costo unitario</span>
                      <InputDinero
                        value={it.costoInsumo}
                        onChange={(v) => actualizarItem(it.id, { costoInsumo: v })}
                        placeholder="0"
                      />
                    </label>
                    <label className="campo campo-inline">
                      <span>Cantidad</span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        inputMode="numeric"
                        value={it.cantidad}
                        onChange={(e) => actualizarItem(it.id, { cantidad: e.target.value })}
                        placeholder="1"
                      />
                    </label>
                  </div>
                </>
              )}

              {it.tipo === "lote" && (
                <label className="campo">
                  <span>Nombre del lote (opcional)</span>
                  <input
                    type="text"
                    value={it.nombreLote}
                    onChange={(e) => actualizarItem(it.id, { nombreLote: e.target.value })}
                    placeholder="Ej. Lote 1, Navidad"
                  />
                </label>
              )}

              {it.tipo === "lote" && (
                <div className="campo">
                  <span>Gramaje por categoria</span>
                  <div className="tabla-precios">
                    {materiales.map((m) => (
                      <div key={m} className="fila-precio">
                        <span className="fila-precio-nombre">
                          {iconoMaterial(m)} {m}
                        </span>
                        <div className="fila-precio-input">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.pesosLote[m] || ""}
                            onChange={(e) =>
                              actualizarItem(it.id, { pesosLote: { ...it.pesosLote, [m]: e.target.value } })
                            }
                            placeholder="0"
                          />
                          <span className="unidad">g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <InterruptorRegalo activo={it.esRegalo} onChange={(v) => actualizarItem(it.id, { esRegalo: v })} />

              {it.esRegalo ? (
                <p className="texto-ayuda">
                  Este producto es un regalo para el cliente: no tiene precio de venta, pero su costo se descuenta de
                  la ganancia de la venta.
                </p>
              ) : hayMonto ? null : it.tipo === "por_gramo" ? (
                <>
                  <label className="campo">
                    <span>Precio de venta por gramo</span>
                    <InputDinero
                      value={it.precioGramoVenta}
                      onChange={(v) => actualizarItem(it.id, { precioGramoVenta: v })}
                      placeholder="0"
                    />
                  </label>
                  <div className="item-venta-ganancia">Total al cliente: {formatCLP(it.calc.precioVenta)}</div>
                </>
              ) : (
                <label className="campo">
                  <span>Precio de venta de este producto</span>
                  <InputDinero
                    value={it.precioVenta}
                    onChange={(v) => actualizarItem(it.id, { precioVenta: v })}
                    placeholder="0"
                  />
                </label>
              )}

              <div className="item-venta-ganancia">
                {it.esRegalo
                  ? `Costo del regalo: ${formatCLP(it.calc.costo)}`
                  : hayMonto
                  ? `Costo: ${formatCLP(it.calc.costo)}`
                  : `Ganancia: ${formatCLP(it.calc.ganancia)}`}
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-secundario btn-ancho" onClick={agregarItem}>
          <Plus size={15} /> Agregar otro producto
        </button>

        <label className="campo">
          <span>Notas (opcional)</span>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalle adicional" />
        </label>

        <div className="resumen-detalle">
          <div className="resumen-detalle-titulo">
            <span>Resumen</span>
            <i>cálculo automático</i>
          </div>
          <h4>Gramos vendidos</h4>
          {Object.keys(gramosVendidos).length === 0 ? (
            <p className="resumen-vacio">Sin gramos</p>
          ) : (
            Object.entries(gramosVendidos).map(([m, g]) => (
              <div key={m} className="resumen-linea">
                <span>
                  {iconoMaterial(m)} {m}
                </span>
                <b>{formatGramos(g)}</b>
              </div>
            ))
          )}
          {Object.keys(gramosRegalados).length > 0 && (
            <>
              <h4>Gramos regalados</h4>
              {Object.entries(gramosRegalados).map(([m, g]) => (
                <div key={m} className="resumen-linea">
                  <span>
                    🎁 {m}
                  </span>
                  <b>{formatGramos(g)}</b>
                </div>
              ))}
            </>
          )}
          <h4>Insumos vendidos</h4>
          {insumosLista.length === 0 ? (
            <p className="resumen-vacio">Sin insumos</p>
          ) : (
            insumosLista.map((x, i) => (
              <div key={i} className="resumen-linea">
                <span>
                  {x.esRegalo ? "🎁 " : "🧰 "}
                  {x.nombre}
                  {x.cantidad > 1 ? ` x${x.cantidad}` : ""}
                </span>
                <b>({formatCLP(x.costo)})</b>
              </div>
            ))
          )}
          {pesoTotalVenta > 0 && (
            <div className="resumen-linea resumen-total">
              <span>Peso total</span>
              <b>{formatGramos(pesoTotalVenta)}</b>
            </div>
          )}
        </div>

        {(costoTotal > 0 || precioVentaTotal > 0) && (
          <BloqueLiquidacion
            liq={calcularLiquidacion({
              vendedor: agendo,
              atendidoPor: atendio,
              compartida,
              pagadoA: pagadoA,
              costoTotal,
              gananciaTotal,
            })}
          />
        )}

        <div className="modal-pie">
          <div className="resumen-calculo">
            <div>
              <span>Venta</span>
              <strong>{formatCLP(precioVentaTotal)}</strong>
            </div>
            <div>
              <span>Costo</span>
              <strong>{formatCLP(costoTotal)}</strong>
            </div>
            <div className={gananciaTotal >= 0 ? "positivo" : "negativo"}>
              <span>Ganancia</span>
              <strong>{formatCLP(gananciaTotal)}</strong>
            </div>
          </div>

          {costoTotal > 0 && precioVentaTotal > 0 && precioVentaTotal < costoTotal && (
            <p className="aviso-venta">
              Ojo: la venta ({formatCLP(precioVentaTotal)}) es menor que el costo ({formatCLP(costoTotal)}). Revisa que el
              monto esté bien escrito.
            </p>
          )}

          {detRealForm && (
            <div className="detalle-privado">
              <Lock size={12} />
              <span>Costo real {formatCLP(detRealForm.costoReal)}</span>
              <span className={detRealForm.total >= 0 ? "positivo" : "negativo"}>
                Mi ganancia real {formatCLP(detRealForm.total)}
              </span>
              <small className="desglose-real">
                <TextoDesgloseReal costoCobrado={costoTotal} d={detRealForm} />
              </small>
            </div>
          )}

          {err && <p className="error-texto">{err}</p>}

          <div className="modal-acciones">
            <button className="btn btn-secundario" onClick={embebido ? onLimpiar : onCerrar}>
              {embebido ? "Limpiar" : "Cancelar"}
            </button>
            <button className="btn btn-primario" onClick={guardar}>
              Guardar venta
            </button>
          </div>
        </div>
      </div>
  );

  if (embebido) return cuerpo;
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {cuerpo}
      </div>
    </div>
  );
}

/* ---------- pestana Venta (formulario directo) ---------- */

function TabVenta({ usuario, esGerente, precios, personas, costosReales, comisiones, onGuardar }) {
  const [clave, setClave] = useState(0);
  const reiniciar = () => setClave((c) => c + 1);
  return (
    <VentaForm
      key={clave}
      mode="crear"
      data={null}
      embebido
      usuario={usuario}
      esGerente={esGerente}
      precios={precios}
      personas={personas}
      costosReales={esGerente ? costosReales : null}
      comisiones={comisiones}
      onLimpiar={reiniciar}
      onGuardar={(venta) => {
        onGuardar(venta);
        reiniciar();
        if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
      }}
    />
  );
}

/* ---------- resumen para el cliente ---------- */

function ResumenClienteModal({ venta, onCerrar }) {
  const [copiado, setCopiado] = useState(false);
  const textareaRef = useRef(null);
  const texto = construirTextoResumen(venta);
  const puedeCompartir = typeof navigator !== "undefined" && !!navigator.share;

  async function copiar() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
      } else if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand("copy");
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      // El cliente puede seleccionar el texto manualmente si esto falla.
    }
  }

  async function compartir() {
    if (!puedeCompartir) return;
    try {
      await navigator.share({ title: "Resumen de tu compra - Joyas Pikete", text: texto });
    } catch (e) {
      // El usuario cancelo el envio o el navegador no lo permitio.
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Resumen para el cliente</h2>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>
        <p className="texto-ayuda">Envia este detalle al cliente por WhatsApp o copialo para mandarlo por otro medio.</p>
        <textarea
          ref={textareaRef}
          className="resumen-texto"
          readOnly
          value={texto}
          rows={14 + (venta.items ? venta.items.length : 1) * 3}
          onFocus={(e) => e.target.select()}
        />
        <div className="modal-acciones modal-acciones-envolver">
          <a
            className="btn btn-primario"
            href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <button className="btn btn-secundario" onClick={copiar}>
            {copiado ? "Copiado" : "Copiar texto"}
          </button>
          {puedeCompartir && (
            <button className="btn btn-secundario" onClick={compartir}>
              <Share2 size={16} /> Compartir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Historial ---------- */

function personaImplicada(v, nombre) {
  return v.vendedor === nombre || v.atendidoPor === nombre || v.pagadoA === nombre;
}

function textoBusqueda(v) {
  return [v.cliente, textoProductosVenta(v), v.notas, v.vendedor, v.atendidoPor, v.pagadoA].join(" ").toLowerCase();
}

function ordenarVentasDesc(lista) {
  return [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.timestamp || "").localeCompare(a.timestamp || ""));
}

function TabHistorial({ ventas, usuario, esGerente, personas, comisiones, costosReales, onEditar, onDuplicar, onEliminar, onResumen, onConfirmarTickets, onQuitarTicket, onActualizar }) {
  const [periodo, setPeriodo] = useState("mes");
  const [busqueda, setBusqueda] = useState("");
  const [atendioF, setAtendioF] = useState("todos");
  const [agendoF, setAgendoF] = useState("todos");
  const [pagoF, setPagoF] = useState("todos");
  const [canalF, setCanalF] = useState("todos");
  const [ticketF, setTicketF] = useState("todos");
  const [confirmandoTodo, setConfirmandoTodo] = useState(false);
  const [limite, setLimite] = useState(40);
  const { desde, hasta } = rangoPorPeriodo(periodo);
  const q = busqueda.trim().toLowerCase();

  // El gerente ve todo; un vendedor, solo lo suyo (lo que agendo, atendio o le pagaron a el).
  const base = esGerente ? ventas : ventas.filter((v) => personaImplicada(v, usuario));
  const filtradas = ordenarVentasDesc(
    base
      .filter((v) => inRango(v.fecha, desde, hasta))
      .filter((v) => atendioF === "todos" || (v.atendidoPor || v.vendedor) === atendioF)
      .filter((v) => agendoF === "todos" || v.vendedor === agendoF)
      .filter((v) => pagoF === "todos" || v.pagadoA === pagoF)
      .filter((v) => canalF === "todos" || v.canal === canalF)
      .filter(
        (v) =>
          ticketF === "todos" ||
          (requiereTicketCosto(v) && (ticketF === "pendiente" ? !ticketConfirmado(v) : ticketConfirmado(v)))
      )
      .filter((v) => !q || textoBusqueda(v).includes(q))
  );
  const totales = sumar(filtradas);

  // Costos que faltan por transferir a Joyas Pikete (de todo el historial visible, sin importar el periodo).
  const baseCostos = esGerente ? base : base.filter((v) => v.pagadoA === usuario);
  const pend = costosPendientes(baseCostos);
  const hayTickets = baseCostos.some((v) => requiereTicketCosto(v));
  const aConfirmar = filtradas.filter((v) => requiereTicketCosto(v) && !ticketConfirmado(v));
  const montoAConfirmar = aConfirmar.reduce((a, v) => a + Math.round(v.costoTotal || 0), 0);
  useEffect(() => {
    setConfirmandoTodo(false);
  }, [pagoF, ticketF, periodo, atendioF, agendoF, canalF, busqueda]);

  function verPendientes(nombre) {
    setPagoF(nombre);
    setTicketF("pendiente");
    setPeriodo("todo");
    setAtendioF("todos");
    setAgendoF("todos");
    setCanalF("todos");
    setBusqueda("");
    setLimite(40);
    if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
  }

  const grupos = [];
  filtradas.slice(0, limite).forEach((v) => {
    let g = grupos[grupos.length - 1];
    if (!g || g.fecha !== v.fecha) {
      g = { fecha: v.fecha, ventas: [] };
      grupos.push(g);
    }
    g.ventas.push(v);
  });
  const ventaDelDia = (fecha) => filtradas.filter((v) => v.fecha === fecha).reduce((a, v) => a + (v.precioVentaTotal || 0), 0);

  const plural = (n, uno, varios) => (n === 1 ? uno : varios);

  return (
    <div>
      {pend.cantidad > 0 && (
        <div className="costos-pendientes">
          <div className="cp-cabeza">
            <b>{esGerente ? "Costos por confirmar" : `Costos que debes transferir a ${GERENTE}`}</b>
            <span>
              {formatCLP(pend.total)} · {pend.cantidad} {plural(pend.cantidad, "venta", "ventas")}
            </span>
          </div>
          {pend.porPersona.map((x) => (
            <div key={x.nombre} className="cp-fila">
              <span>{x.nombre}</span>
              <span>
                {x.cantidad} {plural(x.cantidad, "venta", "ventas")} · {formatCLP(x.monto)}
              </span>
              <button type="button" className="mini-btn" onClick={() => verPendientes(x.nombre)}>
                Ver
              </button>
            </div>
          ))}
        </div>
      )}

      {pend.cantidad === 0 && hayTickets && (
        <div className="costos-al-dia">
          ✓ {esGerente ? "Todos los costos están confirmados con ticket." : `Costos al día: ${GERENTE} ya confirmó todas tus transferencias.`}
        </div>
      )}

      <div className="buscador">
        <Search size={16} />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setLimite(40);
          }}
          placeholder="Buscar por cliente o categoría…"
          aria-label="Buscar por cliente o categoría"
        />
      </div>

      <div className="filtros-select">
        <select value={atendioF} onChange={(e) => setAtendioF(e.target.value)} aria-label="Filtrar por quién atendió">
          <option value="todos">Atendió: Todos</option>
          {personas.map((n) => (
            <option key={n} value={n}>
              Atendió: {n}
            </option>
          ))}
        </select>
        <select value={agendoF} onChange={(e) => setAgendoF(e.target.value)} aria-label="Filtrar por quién agendó">
          <option value="todos">Agendó: Todos</option>
          {personas.map((n) => (
            <option key={n} value={n}>
              Agendó: {n}
            </option>
          ))}
        </select>
        <select value={pagoF} onChange={(e) => setPagoF(e.target.value)} aria-label="Filtrar por a quién le pagaron">
          <option value="todos">Pago: Todos</option>
          {personas.map((n) => (
            <option key={n} value={n}>
              Pago: {n}
            </option>
          ))}
        </select>
        <select value={canalF} onChange={(e) => setCanalF(e.target.value)} aria-label="Filtrar por canal">
          <option value="todos">Canal: Todos</option>
          <option value="presencial">Canal: Presencial</option>
          <option value="online">Canal: Online</option>
        </select>
        <select value={ticketF} onChange={(e) => setTicketF(e.target.value)} aria-label="Filtrar por ticket del costo">
          <option value="todos">Costo: Todos</option>
          <option value="pendiente">Costo: Sin ticket (por confirmar)</option>
          <option value="confirmado">Costo: Con ticket (transferido)</option>
        </select>
      </div>

      {esGerente && ticketF === "pendiente" && aConfirmar.length > 0 && (
        <div className="confirmar-lote">
          {!confirmandoTodo ? (
            <button type="button" className="btn btn-primario btn-ancho" onClick={() => setConfirmandoTodo(true)}>
              Confirmar transferencia de {plural(aConfirmar.length, "esta venta", `estas ${aConfirmar.length} ventas`)} ({formatCLP(montoAConfirmar)})
            </button>
          ) : (
            <div className="confirmar-lote-caja">
              <p>
                ¿Ya revisaste que te transfirieron {formatCLP(montoAConfirmar)} por {aConfirmar.length}{" "}
                {plural(aConfirmar.length, "venta", "ventas")}?
              </p>
              <div className="modal-acciones">
                <button type="button" className="btn btn-secundario" onClick={() => setConfirmandoTodo(false)}>
                  No
                </button>
                <button
                  type="button"
                  className="btn btn-primario"
                  onClick={() => {
                    onConfirmarTickets(aConfirmar.map((v) => v.id));
                    setConfirmandoTodo(false);
                  }}
                >
                  Sí, confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="filtros-periodo">
        {PERIODOS.map((pe) => (
          <button
            key={pe.id}
            className={`chip ${periodo === pe.id ? "chip-activo" : ""}`}
            onClick={() => {
              setPeriodo(pe.id);
              setLimite(40);
            }}
          >
            {pe.label}
          </button>
        ))}
      </div>

      <div className="historial-resumen-fila">
        <p className="historial-resumen">
        {filtradas.length} {filtradas.length === 1 ? "venta" : "ventas"} · {formatCLP(totales.venta)}
        {esGerente ? ` · ganancia ${formatCLP(totales.ganancia)}` : ""}
      </p>
        <button type="button" className="mini-btn" onClick={onActualizar} aria-label="Actualizar las ventas">
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {filtradas.length === 0 && <p className="vacio">No hay ventas con estos filtros.</p>}

      {grupos.map((g) => (
        <section key={g.fecha} className="grupo-dia">
          <div className="grupo-dia-cabeza">
            <span>{etiquetaDia(g.fecha)}</span>
            <span>{formatCLP(ventaDelDia(g.fecha))}</span>
          </div>
          <div className="lista-ventas">
            {g.ventas.map((v) => (
              <VentaFila
                key={v.id}
                venta={v}
                ocultarDia
                puedeConfirmarTicket={esGerente}
                onConfirmarTicket={() => onConfirmarTickets([v.id])}
                onQuitarTicket={() => onQuitarTicket(v.id)}
                onEditar={() => onEditar(v)}
                onDuplicar={() => onDuplicar(v)}
                onEliminar={() => onEliminar(v.id)}
                onResumen={() => onResumen(v)}
                comisiones={comisiones}
                comisionDe={esGerente ? undefined : usuario}
                costosReales={esGerente ? costosReales : undefined}
                puedeEditar={esGerente || v.vendedor === usuario || v.atendidoPor === usuario}
              />
            ))}
          </div>
        </section>
      ))}

      {filtradas.length > limite && (
        <button className="btn btn-secundario btn-ancho" onClick={() => setLimite((l) => l + 40)}>
          Ver más ({filtradas.length - limite} restantes)
        </button>
      )}
    </div>
  );
}

/* ---------- piezas compartidas de Reportes y Graficos ---------- */

const EJE_GRIS = { fill: "#9C9AA5", fontSize: 10.5 };
const TOOLTIP_ESTILO = {
  background: "#201F26",
  border: "1px solid rgba(242,199,90,0.25)",
  borderRadius: 6,
  color: "#F5F3EE",
  fontSize: 12.5,
};

function ChipsGranularidad({ valor, onCambio }) {
  return (
    <div className="filtros-periodo">
      {GRANULARIDADES.map((g) => (
        <button key={g.id} className={`chip ${valor === g.id ? "chip-activo" : ""}`} onClick={() => onCambio(g.id)}>
          {g.label}
        </button>
      ))}
    </div>
  );
}

function NavegadorPeriodo({ etiqueta, onAnterior, onSiguiente, puedeAvanzar }) {
  return (
    <div className="navegador-periodo">
      <button type="button" className="icon-btn" onClick={onAnterior} aria-label="Periodo anterior">
        <ChevronLeft size={17} />
      </button>
      <strong>{etiqueta}</strong>
      <button type="button" className="icon-btn" onClick={onSiguiente} disabled={!puedeAvanzar} aria-label="Periodo siguiente">
        <ChevronRight size={17} />
      </button>
    </div>
  );
}

function BarrasRanking({ filas }) {
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <div className="ranking">
      {filas.map((f) => (
        <div key={f.nombre} className="ranking-fila">
          <div className="ranking-cabeza">
            <b style={{ color: f.color }}>{f.nombre}</b>
            <span>{f.texto}</span>
          </div>
          <div className="ranking-barra">
            <div style={{ width: `${Math.max(2, (Math.max(f.valor, 0) / max) * 100)}%`, background: f.color }} />
          </div>
          {f.sub && <div className="ranking-sub">{f.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function TarjetaGrafico({ titulo, subtitulo, children }) {
  return (
    <section className="tarjeta">
      <header className="tarjeta-cabeza">
        <h3>{titulo}</h3>
        {subtitulo && <span>{subtitulo}</span>}
      </header>
      <div className="tarjeta-cuerpo">{children}</div>
    </section>
  );
}

function GraficoLineas({ data, claveX, series, alto = 220, formatoValor = formatCLP }) {
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <LineChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,199,90,0.08)" vertical={false} />
        <XAxis dataKey={claveX} tick={EJE_GRIS} tickLine={false} axisLine={{ stroke: "rgba(242,199,90,0.18)" }} />
        <YAxis tick={EJE_GRIS} tickLine={false} axisLine={false} width={40} tickFormatter={abreviar} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_ESTILO} formatter={(value) => formatoValor(value)} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11.5 }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name || s.key}
            stroke={s.color}
            strokeWidth={2.2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function TablaProductos({ productos }) {
  const [orden, setOrden] = useState({ col: "ingresos", desc: true });
  if (productos.length === 0) return <p className="vacio">No hay productos vendidos en este periodo.</p>;
  const filas = productos.map((pr) => ({ ...pr, prom: pr.cantidad > 0 ? pr.gramos / pr.cantidad : 0 }));
  filas.sort((a, b) => {
    const dir = orden.desc ? -1 : 1;
    if (orden.col === "material") return dir * a.material.localeCompare(b.material, "es");
    return dir * ((a[orden.col] || 0) - (b[orden.col] || 0));
  });
  const total = filas.reduce(
    (acc, pr) => ({ cantidad: acc.cantidad + pr.cantidad, gramos: acc.gramos + pr.gramos, ingresos: acc.ingresos + pr.ingresos }),
    { cantidad: 0, gramos: 0, ingresos: 0 }
  );
  const cabeza = (col, texto) => (
    <button
      type="button"
      className={`th ${orden.col === col ? "th-activo" : ""}`}
      onClick={() => setOrden((o) => ({ col, desc: o.col === col ? !o.desc : col !== "material" }))}
    >
      {texto}
      {orden.col === col ? (orden.desc ? " ▼" : " ▲") : ""}
    </button>
  );
  return (
    <div className="tabla-comparativa">
      <div className="tc-fila tc-cabeza">
        {cabeza("material", "Producto")}
        {cabeza("cantidad", "Ventas")}
        {cabeza("gramos", "Gramos")}
        {cabeza("prom", "Prom/V")}
        {cabeza("ingresos", "Ingresos")}
      </div>
      {filas.map((pr) => (
        <div key={pr.material} className="tc-fila">
          <span className="tc-producto">
            {pr.esInsumo ? "🧰" : iconoMaterial(pr.material)} {pr.material}
          </span>
          <span>{pr.cantidad}</span>
          <span>{pr.gramos > 0 ? formatGramos(pr.gramos) : "—"}</span>
          <span>{pr.gramos > 0 ? formatGramos(pr.prom) : "—"}</span>
          <b>{formatCLP(pr.ingresos)}</b>
        </div>
      ))}
      <div className="tc-fila tc-total">
        <span>Total</span>
        <span>{total.cantidad}</span>
        <span>{formatGramos(total.gramos)}</span>
        <span>—</span>
        <b>{formatCLP(total.ingresos)}</b>
      </div>
    </div>
  );
}

function ListaVentasPeriodo({ ventas, etiqueta, costosReales, comisiones, onToast }) {
  const [abierto, setAbierto] = useState(false);
  const ordenadas = ordenarVentasDesc(ventas);
  const slug = etiqueta.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, "-").replace(/^-|-$/g, "");

  function descargar() {
    const ok = descargarArchivo(`ventas-${slug}.csv`, ventasACSV(ventas, costosReales, comisiones), "text/csv;charset=utf-8");
    onToast(ok ? "CSV descargado." : "No se pudo descargar el CSV. Prueba con Copiar.");
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(ventasACSV(ventas, costosReales, comisiones));
      onToast("CSV copiado: pégalo en Excel o Google Sheets.");
    } catch (e) {
      onToast("No se pudo copiar el CSV.");
    }
  }

  return (
    <div className="acordeon">
      <div className="acordeon-cabeza">
        <span className="acordeon-titulo">Ventas del período</span>
        <div className="acordeon-acciones">
          <button type="button" className="mini-btn" onClick={descargar} disabled={ventas.length === 0}>
            <Download size={12} /> CSV
          </button>
          <button type="button" className="mini-btn" onClick={copiar} disabled={ventas.length === 0}>
            <Copy size={12} /> Copiar
          </button>
          <button type="button" className="mini-btn" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}>
            {ventas.length} <ChevronDown size={13} className={abierto ? "giro" : ""} />
          </button>
        </div>
      </div>
      {abierto && (
        <div className="lista-compacta">
          {ordenadas.length === 0 && <p className="vacio">No hay ventas en este periodo.</p>}
          {ordenadas.slice(0, 200).map((v) => (
            <div key={v.id} className="fila-compacta">
              <span className="fc-fecha">{formatFechaCorta(v.fecha)}</span>
              <span className="fc-cliente">{v.cliente || "Sin nombre"}</span>
              <span className="fc-personas">
                {v.vendedor}
                {v.compartida ? ` / ${v.atendidoPor}` : ""}
              </span>
              <b className="fc-monto">{formatCLP(v.precioVentaTotal)}</b>
            </div>
          ))}
          {ordenadas.length > 200 && <p className="texto-ayuda">Se muestran 200; el CSV trae todas.</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Reportes (gerente) ---------- */

function TabReportes({ ventas, vendedores, personas, comisiones, costosReales, onToast }) {
  const [granularidad, setGranularidad] = useState("mensual");
  const [offset, setOffset] = useState(0);
  const [vistaCanal, setVistaCanal] = useState("presencial");

  const rango = rangoPeriodo(granularidad, offset);
  const previo = rangoPeriodo(granularidad, offset - 1);
  const filtradas = ventas.filter((v) => inRango(v.fecha, rango.desde, rango.hasta));
  const previas = ventas.filter((v) => inRango(v.fecha, previo.desde, previo.hasta));
  const totales = sumar(filtradas);
  const totalesPrev = sumar(previas);
  const totalesReal = sumarReal(filtradas, costosReales, comisiones);
  const clientesUnicos = new Set(
    filtradas.filter((v) => v.cliente && v.cliente.trim()).map((v) => v.cliente.trim().toLowerCase())
  ).size;
  const margen = totales.venta > 0 ? Math.round((totales.ganancia / totales.venta) * 100) : 0;
  const margenReal = totales.venta > 0 ? Math.round((totalesReal.gananciaReal / totales.venta) * 100) : 0;
  const deltaVenta = variacionPct(totales.venta, totalesPrev.venta);
  const deltaGanancia = variacionPct(totales.ganancia, totalesPrev.ganancia);

  const fraccion = offset === 0 ? fraccionTranscurrida(granularidad) : null;
  const proyeccion = fraccion && fraccion > 0 && fraccion < 1 && filtradas.length > 0 ? Math.round(totales.venta / fraccion) : null;
  const etiquetaProyeccion = { semanal: "de la semana", mensual: "del mes", anual: "del año" }[granularidad];

  const porVendedor = vendedores.map((nombre) => {
    const t = sumarTotalPersona(filtradas, nombre, comisiones);
    return { nombre, ...t, clientes: clientesDePersona(filtradas, nombre) };
  });
  // Incluye al administrador: su parte (a costo de vendedores) cuando agenda o atiende.
  const porPersona = personas.map((nombre) => {
    const t = sumarTotalPersona(filtradas, nombre, comisiones);
    return { nombre, ...t, clientes: clientesDePersona(filtradas, nombre) };
  });
  const rankingGanancia = [...porPersona].filter((x) => x.cantidad > 0).sort((a, b) => b.ganancia - a.ganancia);
  // Dinero recibido: a quien le pago el cliente en cada venta.
  const cobros = personas
    .map((nombre) => {
      const mias = filtradas.filter((v) => v.pagadoA === nombre);
      return { nombre, cantidad: mias.length, total: mias.reduce((a, v) => a + (v.precioVentaTotal || 0), 0) };
    })
    .filter((c) => c.cantidad > 0)
    .sort((a, b) => b.total - a.total);
  const ventasSinPagadoA = filtradas.filter((v) => !v.pagadoA).length;
  const mejorVendedor = porVendedor.reduce((mejor, v) => (!mejor || v.ganancia > mejor.ganancia ? v : mejor), null);
  const mejorPorClientes = porVendedor.reduce((mejor, v) => (!mejor || v.clientes > mejor.clientes ? v : mejor), null);
  const agendas = personas
    .map((nombre) => ({ nombre, n: filtradas.filter((v) => v.vendedor === nombre).length }))
    .sort((a, b) => b.n - a.n);
  const masAgenda = agendas[0] && agendas[0].n > 0 ? agendas[0] : null;

  const filasComision = vendedores
    .map((nombre) => {
      const agendo = sumarComoVendedor(filtradas, nombre, comisiones).comision;
      const atendio = sumarComoApoyo(filtradas, nombre, comisiones).comision;
      return { nombre, pct: comisiones[nombre] || 0, agendo, atendio, total: agendo + atendio };
    })
    .filter((f) => f.pct > 0)
    .sort((a, b) => b.total - a.total);
  const totalComisiones = filasComision.reduce((a, f) => a + f.total, 0);

  const rankingCanal = vendedores
    .map((nombre) => ({
      nombre,
      valor:
        vistaCanal === "presencial"
          ? clientesPresencialesDePersona(filtradas, nombre)
          : ventasOnlineDePersona(filtradas, nombre),
    }))
    .sort((a, b) => b.valor - a.valor);

  const productos = productosMasVendidos(filtradas);
  const productoEstrella = productos[0] || null;
  const totalRegalos = costoRegalos(filtradas);

  return (
    <div>
      <ChipsGranularidad
        valor={granularidad}
        onCambio={(g) => {
          setGranularidad(g);
          setOffset(0);
        }}
      />
      <NavegadorPeriodo
        etiqueta={rango.etiqueta}
        onAnterior={() => setOffset((o) => o - 1)}
        onSiguiente={() => setOffset((o) => Math.min(o + 1, 0))}
        puedeAvanzar={offset < 0}
      />

      <div className="stats-grid">
        <StatCard
          label="Ventas"
          valor={formatCLP(totales.venta)}
          delta={deltaVenta}
          sub={`${filtradas.length} ${filtradas.length === 1 ? "venta" : "ventas"}`}
        />
        <StatCard label="Ganancia" valor={formatCLP(totales.ganancia)} destacar delta={deltaGanancia} sub={`${margen}% margen`} />
        <StatCard label="Costo" valor={formatCLP(totales.costo)} sub="Mercadería" />
        <StatCard label="Clientes atendidos" valor={clientesUnicos} />
        {totalRegalos > 0 && <StatCard label="Costo en regalos" valor={formatCLP(totalRegalos)} />}
      </div>

      <div className="bloque-privado">
        <div className="aviso-privado">
          <Lock size={14} /> Informacion privilegiada, solo tu la ves
        </div>
        <div className="stats-grid">
          <StatCard label="Costo real" valor={formatCLP(totalesReal.costoReal)} sub="Lo que te cuesta la mercadería" />
          <StatCard label="Mi ganancia real" valor={formatCLP(totalesReal.gananciaReal)} destacar sub={`${margenReal}% de las ventas`} />
        </div>
        <div className="desglose-real-lista">
          <div>
            <span>Margen de costo (lo que cobras a vendedores − costo real)</span>
            <b>{formatCLP(totalesReal.margenCosto)}</b>
          </div>
          {totalesReal.parteVenta !== 0 && (
            <div>
              <span>Tu parte como vendedor (ventas que agendas o atiendes)</span>
              <b>{formatCLP(totalesReal.parteVenta)}</b>
            </div>
          )}
          {totalesReal.comision > 0 && (
            <div>
              <span>Comisiones que cobras a vendedores</span>
              <b>{formatCLP(totalesReal.comision)}</b>
            </div>
          )}
        </div>
      </div>

      {filtradas.length > 0 && (
        <TarjetaGrafico titulo="Inteligencia de negocio" subtitulo={rango.etiqueta}>
          <div className="inteligencia">
            {proyeccion != null && (
              <div className="inteligencia-item">
                <span>📈 Proyección {etiquetaProyeccion}</span>
                <b>{formatCLP(proyeccion)}</b>
                <small>Al ritmo actual</small>
              </div>
            )}
            <div className="inteligencia-item">
              <span>⭐ Mejor vendedor (ganancia)</span>
              <b>{mejorVendedor ? mejorVendedor.nombre : "-"}</b>
              <small>{mejorVendedor ? formatCLP(mejorVendedor.ganancia) : ""}</small>
            </div>
            <div className="inteligencia-item">
              <span>🤝 Mas clientes atendidos</span>
              <b>{mejorPorClientes ? mejorPorClientes.nombre : "-"}</b>
              <small>{mejorPorClientes ? `${mejorPorClientes.clientes} clientes` : ""}</small>
            </div>
            <div className="inteligencia-item">
              <span>📋 Más agenda</span>
              <b>{masAgenda ? masAgenda.nombre : "-"}</b>
              <small>{masAgenda ? `${masAgenda.n} citas agendadas` : ""}</small>
            </div>
            <div className="inteligencia-item">
              <span>💎 Producto estrella</span>
              <b>{productoEstrella ? productoEstrella.material : "-"}</b>
              <small>{productoEstrella ? `${formatCLP(productoEstrella.ingresos)} en ingresos` : ""}</small>
            </div>
          </div>
        </TarjetaGrafico>
      )}

      {filasComision.length > 0 && (
        <TarjetaGrafico titulo="Comisiones por persona" subtitulo={`${formatCLP(totalComisiones)} total`}>
          <BarrasRanking
            filas={filasComision.map((f) => ({
              nombre: f.nombre,
              valor: f.total,
              color: colorDe(f.nombre),
              texto: `${f.pct}% · ${formatCLP(f.total)}`,
              sub: `Agendó ${formatCLP(f.agendo)} · Atendió ${formatCLP(f.atendio)}`,
            }))}
          />
        </TarjetaGrafico>
      )}

      <h3 className="subtitulo">Ganancia por persona</h3>
      {rankingGanancia.length === 0 ? (
        <p className="vacio">No hay ventas en este periodo.</p>
      ) : (
        <div className="tarjeta tarjeta-cuerpo">
          <BarrasRanking
            filas={rankingGanancia.map((x) => ({
              nombre: x.nombre,
              valor: x.ganancia,
              color: colorDe(x.nombre),
              texto: `${formatCLP(x.ganancia)} · ${x.cantidad} ${x.cantidad === 1 ? "venta" : "ventas"}`,
            }))}
          />
        </div>
      )}

      <h3 className="subtitulo">Detalle por persona</h3>
      <div className="tabla-vendedores">
        {porPersona.map((v) => (
          <div key={v.nombre} className="fila-vendedor">
            <div className="fila-vendedor-nombre">{v.nombre}</div>
            <div className="fila-vendedor-datos">
              <span>{v.cantidad} ventas</span>
              <span>{v.clientes} clientes</span>
              <span>{formatCLP(v.venta)} ingresos</span>
              <span className={v.ganancia >= 0 ? "positivo" : "negativo"}>{formatCLP(v.ganancia)} ganancia</span>
              {v.comision > 0 && <span>{formatCLP(v.comision)} comision</span>}
            </div>
          </div>
        ))}
      </div>

      <h3 className="subtitulo">Dinero recibido (a quién le pagaron)</h3>
      <div className="tabla-vendedores">
        {cobros.length === 0 ? (
          <p className="vacio">Todavia no hay ventas con "A quién le pagó" en este periodo.</p>
        ) : (
          cobros.map((c) => (
            <div key={c.nombre} className="fila-vendedor">
              <div className="fila-vendedor-nombre">{c.nombre}</div>
              <div className="fila-vendedor-datos">
                <span>{c.cantidad} {c.cantidad === 1 ? "venta" : "ventas"}</span>
                <span>{formatCLP(c.total)} recibidos</span>
              </div>
            </div>
          ))
        )}
        {cobros.length > 0 && ventasSinPagadoA > 0 && (
          <p className="texto-ayuda">
            {ventasSinPagadoA} {ventasSinPagadoA === 1 ? "venta anterior no tiene" : "ventas anteriores no tienen"} ese dato.
          </p>
        )}
      </div>

      <h3 className="subtitulo">Ranking por canal</h3>
      <div className="toggle-grupo">
        <button
          type="button"
          className={`toggle-btn ${vistaCanal === "presencial" ? "activo" : ""}`}
          onClick={() => setVistaCanal("presencial")}
        >
          Presencial
        </button>
        <button
          type="button"
          className={`toggle-btn ${vistaCanal === "online" ? "activo" : ""}`}
          onClick={() => setVistaCanal("online")}
        >
          Online
        </button>
      </div>
      <div className="tabla-vendedores">
        {rankingCanal.every((r) => r.valor === 0) ? (
          <p className="vacio">
            {vistaCanal === "presencial"
              ? "No hay clientes presenciales en este periodo."
              : "No hay ventas online en este periodo."}
          </p>
        ) : (
          rankingCanal.map((r) => (
            <div key={r.nombre} className="fila-vendedor">
              <div className="fila-vendedor-nombre">{r.nombre}</div>
              <div className="fila-vendedor-datos">
                <span>
                  {r.valor}{" "}
                  {vistaCanal === "presencial"
                    ? r.valor === 1 ? "cliente presencial" : "clientes presenciales"
                    : r.valor === 1 ? "venta online" : "ventas online"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <TarjetaGrafico titulo="Agendadores · ranking" subtitulo="por agendas">
        {agendas.every((a) => a.n === 0) ? (
          <p className="vacio">No hay agendas en este periodo.</p>
        ) : (
          <BarrasRanking
            filas={agendas
              .filter((a) => a.n > 0)
              .map((a) => ({ nombre: a.nombre, valor: a.n, color: colorDe(a.nombre), texto: `${a.n} agendas` }))}
          />
        )}
      </TarjetaGrafico>

      <h3 className="subtitulo">Productos mas vendidos</h3>
      <p className="texto-ayuda">Toca una columna para ordenar.</p>
      <TablaProductos productos={productos} />

      <ListaVentasPeriodo ventas={filtradas} etiqueta={rango.etiqueta} costosReales={costosReales} comisiones={comisiones} onToast={onToast} />
    </div>
  );
}

/* ---------- Reportes (vendedor: solo lo suyo) ---------- */

function TabReportesVendedor({ usuario, ventas, comisiones }) {
  const [granularidad, setGranularidad] = useState("mensual");
  const [offset, setOffset] = useState(0);
  const rango = rangoPeriodo(granularidad, offset);
  const previo = rangoPeriodo(granularidad, offset - 1);
  const mias = ventas.filter((v) => personaImplicada(v, usuario));
  const propias = mias.filter((v) => inRango(v.fecha, rango.desde, rango.hasta));
  const previas = mias.filter((v) => inRango(v.fecha, previo.desde, previo.hasta));
  const totales = sumarTotalPersona(propias, usuario, comisiones);
  const totalesPrev = sumarTotalPersona(previas, usuario, comisiones);
  const gananciaNeta = totales.ganancia - totales.comision;
  const gananciaNetaPrev = totalesPrev.ganancia - totalesPrev.comision;
  const recibido = propias.filter((v) => v.pagadoA === usuario).reduce((acc, v) => acc + (v.precioVentaTotal || 0), 0);
  const agendaste = propias.filter((v) => v.vendedor === usuario).length;
  const atendiste = propias.filter((v) => (v.atendidoPor || v.vendedor) === usuario).length;

  return (
    <div>
      <ChipsGranularidad
        valor={granularidad}
        onCambio={(g) => {
          setGranularidad(g);
          setOffset(0);
        }}
      />
      <NavegadorPeriodo
        etiqueta={rango.etiqueta}
        onAnterior={() => setOffset((o) => o - 1)}
        onSiguiente={() => setOffset((o) => Math.min(o + 1, 0))}
        puedeAvanzar={offset < 0}
      />
      <div className="stats-grid">
        <StatCard
          label="Ventas"
          valor={formatCLP(totales.venta)}
          delta={variacionPct(totales.venta, totalesPrev.venta)}
          sub={`${totales.cantidad} ${totales.cantidad === 1 ? "venta" : "ventas"}`}
        />
        <StatCard label="Ganancia" valor={formatCLP(gananciaNeta)} destacar delta={variacionPct(gananciaNeta, gananciaNetaPrev)} />
        <StatCard label="Agendaste" valor={`${agendaste} ${agendaste === 1 ? "cliente" : "clientes"}`} />
        <StatCard label="Atendiste" valor={`${atendiste} ${atendiste === 1 ? "cliente" : "clientes"}`} />
        {totales.comision > 0 && <StatCard label="Comision descontada" valor={formatCLP(totales.comision)} />}
        {recibido > 0 && <StatCard label="Dinero que te pagaron" valor={formatCLP(recibido)} />}
      </div>

      <h3 className="subtitulo">Productos de tus ventas</h3>
      <p className="texto-ayuda">Toca una columna para ordenar.</p>
      <TablaProductos productos={productosMasVendidos(propias.filter((v) => v.vendedor === usuario || v.atendidoPor === usuario))} />
    </div>
  );
}

/* ---------- Graficos (gerente) ---------- */

function TabGraficos({ ventas, personas }) {
  const [offset, setOffset] = useState(0);
  const rango = rangoPeriodo("mensual", offset);
  const delMes = ventas.filter((v) => inRango(v.fecha, rango.desde, rango.hasta));
  const totalesMes = sumar(delMes);
  const meses6 = ultimosMeses(6, rango.desde);
  const meses12 = ultimosMeses(12, rango.desde);
  const ventasDe = (clave) => ventas.filter((v) => v.fecha && v.fecha.startsWith(clave));

  const rendimiento = meses6.map((m) => {
    const vm = ventasDe(m.clave);
    const fila = { mes: m.etiqueta };
    personas.forEach((n) => {
      fila[n] = Math.round(sumarTotalPersona(vm, n, {}).ganancia);
    });
    return fila;
  });
  const personasRend = personas.filter((n) => rendimiento.some((f) => f[n] !== 0));

  const actividad = meses6.map((m) => {
    const vm = ventasDe(m.clave);
    const fila = { mes: m.etiqueta };
    personas.forEach((n) => {
      fila[n] = vm.filter((v) => v.vendedor === n).length;
    });
    return fila;
  });
  const personasAct = personas.filter((n) => actividad.some((f) => f[n] !== 0));

  const diaria = serieDiariaMes(ventas, rango.desde);

  const ventas6 = ventas.filter((v) => v.fecha && v.fecha >= `${meses6[0].clave}-01` && v.fecha <= rango.hasta);
  const topProductos = productosMasVendidos(ventas6).slice(0, 4);
  const mix = meses6.map((m) => {
    const prods = productosMasVendidos(ventasDe(m.clave));
    const fila = { mes: m.etiqueta };
    topProductos.forEach((tp) => {
      const f = prods.find((x) => x.material === tp.material);
      fila[tp.material] = f ? Math.round(f.ingresos) : 0;
    });
    return fila;
  });

  const tendencia = meses12.map((m) => {
    const t = sumar(ventasDe(m.clave));
    return { mes: m.etiqueta, Venta: t.venta, Ganancia: t.ganancia };
  });

  const patron = patronAgenda(ventas);
  const maxDias = Math.max(...patron.topDias.map((x) => x.n), 1);
  const maxHoras = Math.max(...patron.topHoras.map((x) => x.n), 1);

  if (ventas.length === 0) {
    return <p className="vacio">Aun no hay ventas para graficar. Registra la primera en la pestaña Venta.</p>;
  }

  return (
    <div>
      <NavegadorPeriodo
        etiqueta={rango.etiqueta}
        onAnterior={() => setOffset((o) => o - 1)}
        onSiguiente={() => setOffset((o) => Math.min(o + 1, 0))}
        puedeAvanzar={offset < 0}
      />

      <TarjetaGrafico titulo="Rendimiento vendedores" subtitulo="últimos 6 meses · ganancia">
        {personasRend.length === 0 ? (
          <p className="vacio">Sin datos en estos meses.</p>
        ) : (
          <GraficoLineas
            data={rendimiento}
            claveX="mes"
            series={personasRend.map((n) => ({ key: n, color: colorDe(n) }))}
            alto={250}
          />
        )}
      </TarjetaGrafico>

      <TarjetaGrafico titulo="Actividad agendadores" subtitulo="últimos 6 meses · agendas">
        {personasAct.length === 0 ? (
          <p className="vacio">Sin datos en estos meses.</p>
        ) : (
          <GraficoLineas
            data={actividad}
            claveX="mes"
            series={personasAct.map((n) => ({ key: n, color: colorDe(n) }))}
            alto={250}
            formatoValor={(v) => `${v} agendas`}
          />
        )}
      </TarjetaGrafico>

      <TarjetaGrafico titulo="Venta vs Ganancia" subtitulo={`${delMes.length} ventas · ${formatCLP(totalesMes.venta)}`}>
        <GraficoLineas
          data={diaria}
          claveX="dia"
          series={[
            { key: "venta", name: "Venta", color: "#8EC5F5" },
            { key: "ganancia", name: "Ganancia", color: "#4ADE80" },
          ]}
        />
      </TarjetaGrafico>

      <TarjetaGrafico titulo="Mejor agenda" subtitulo="patrón histórico">
        {patron.topDias.length === 0 ? (
          <p className="vacio">Sin datos.</p>
        ) : (
          <>
            <h4 className="mini-titulo">📅 Mejores días</h4>
            {patron.topDias.map((x) => (
              <div key={x.nombre} className="barra-patron">
                <b>{x.nombre}</b>
                <div className="ranking-barra">
                  <div style={{ width: `${(x.n / maxDias) * 100}%`, background: "#8EC5F5" }} />
                </div>
                <span>{x.n} {x.n === 1 ? "venta" : "ventas"}</span>
              </div>
            ))}
            <h4 className="mini-titulo">⏰ Mejores horarios</h4>
            {patron.topHoras.map((x) => (
              <div key={x.nombre} className="barra-patron">
                <b>{x.nombre}</b>
                <div className="ranking-barra">
                  <div style={{ width: `${(x.n / maxHoras) * 100}%`, background: "#8EC5F5" }} />
                </div>
                <span>{x.n} {x.n === 1 ? "venta" : "ventas"}</span>
              </div>
            ))}
            <p className="texto-ayuda">Los horarios son los de registro de cada venta.</p>
          </>
        )}
      </TarjetaGrafico>

      <TarjetaGrafico titulo="Mix de ingresos" subtitulo="últimos 6 meses">
        {topProductos.length === 0 ? (
          <p className="vacio">Sin datos en estos meses.</p>
        ) : (
          <GraficoLineas
            data={mix}
            claveX="mes"
            series={topProductos.map((tp, i) => ({ key: tp.material, color: COLORES_LINEAS[i % COLORES_LINEAS.length] }))}
            alto={250}
          />
        )}
      </TarjetaGrafico>

      <TarjetaGrafico titulo="Tendencia mensual" subtitulo="últimos 12 meses">
        <GraficoLineas
          data={tendencia}
          claveX="mes"
          series={[
            { key: "Venta", color: "#8EC5F5" },
            { key: "Ganancia", color: "#4ADE80" },
          ]}
        />
      </TarjetaGrafico>

      <TarjetaGrafico titulo="Cantidad de ventas" subtitulo={rango.etiqueta}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={diaria} margin={{ top: 18, right: 10, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,199,90,0.08)" vertical={false} />
            <XAxis dataKey="dia" tick={EJE_GRIS} tickLine={false} axisLine={{ stroke: "rgba(242,199,90,0.18)" }} interval={2} />
            <YAxis hide allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_ESTILO} formatter={(value) => `${value} ventas`} cursor={{ fill: "rgba(242,199,90,0.05)" }} />
            <Bar dataKey="ventas" name="Ventas" fill="#38BDF8" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="ventas" position="top" fill="#9C9AA5" fontSize={9.5} formatter={(v) => (v > 0 ? v : "")} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </TarjetaGrafico>
    </div>
  );
}

function TabPrecios({ precios, onGuardar }) {
  const [borrador, setBorrador] = useState(precios);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setBorrador(precios);
  }, [precios]);

  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(precios);

  function cambiarPrecio(nombre, valor) {
    setBorrador((prev) => ({ ...prev, [nombre]: valor === "" ? "" : Number(valor) }));
  }
  function eliminarMaterial(nombre) {
    setBorrador((prev) => {
      const copia = { ...prev };
      delete copia[nombre];
      return copia;
    });
  }
  function agregarMaterial() {
    if (!nuevoNombre.trim() || nuevoPrecio === "") return;
    setBorrador((prev) => ({ ...prev, [nuevoNombre.trim()]: Number(nuevoPrecio) }));
    setNuevoNombre("");
    setNuevoPrecio("");
  }
  async function guardar() {
    setGuardando(true);
    await onGuardar(borrador);
    setGuardando(false);
  }

  return (
    <div>
      <p className="texto-ayuda">
        Precio por gramo de cada tipo de mercaderia (lo que usan los vendedores para calcular su ganancia). Puedes
        actualizarlo cuando estimes conveniente: los cambios no afectan las ventas ya registradas, solo las nuevas.
      </p>
      <div className="tabla-precios">
        {Object.entries(borrador).map(([nombre, precio]) => (
          <div key={nombre} className="fila-precio">
            <span className="fila-precio-nombre">{nombre}</span>
            <div className="fila-precio-input">
              <span>$</span>
              <InputDinero value={precio} onChange={(v) => cambiarPrecio(nombre, v)} />
              <span className="unidad">/g</span>
            </div>
            <button className="icon-btn" onClick={() => eliminarMaterial(nombre)} aria-label={`Eliminar ${nombre}`}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="agregar-material">
        <input
          type="text"
          placeholder="Nuevo tipo de mercaderia"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
        />
        <InputDinero placeholder="$/g" value={nuevoPrecio} onChange={setNuevoPrecio} />
        <button className="btn btn-secundario" onClick={agregarMaterial}>
          <Plus size={15} /> Agregar
        </button>
      </div>

      {hayCambios && (
        <button className="btn btn-primario btn-ancho" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      )}
    </div>
  );
}

function TabCostoReal({ costosReales, materiales, onGuardar }) {
  const [borrador, setBorrador] = useState(costosReales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setBorrador(costosReales);
  }, [costosReales]);

  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(costosReales);

  function cambiar(nombre, valor) {
    setBorrador((prev) => ({ ...prev, [nombre]: valor === "" ? "" : Number(valor) }));
  }
  async function guardar() {
    setGuardando(true);
    await onGuardar(borrador);
    setGuardando(false);
  }

  return (
    <div>
      <div className="aviso-privado">
        <Lock size={14} /> Informacion privilegiada: solo tu la ves, los vendedores nunca ven estos valores.
      </div>
      <p className="texto-ayuda">
        Costo real por gramo de cada mercaderia (lo que realmente te cuesta). Sirve para calcular tu ganancia real
        (lo que cobras a los vendedores menos lo que realmente te cuesta), aparte de la ganancia que ven los vendedores.
        Actualizalo cuando quieras.
      </p>
      <div className="tabla-precios">
        {materiales.map((nombre) => (
          <div key={nombre} className="fila-precio">
            <span className="fila-precio-nombre">{nombre}</span>
            <div className="fila-precio-input">
              <span>$</span>
              <InputDinero
                value={borrador[nombre] != null ? borrador[nombre] : ""}
                onChange={(v) => cambiar(nombre, v)}
                placeholder="0"
              />
              <span className="unidad">/g</span>
            </div>
          </div>
        ))}
      </div>
      {hayCambios && (
        <button className="btn btn-primario btn-ancho" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      )}
    </div>
  );
}

/* ---------- lotes ---------- */

function LoteModal({ mode, data, materiales, onCerrar, onGuardar }) {
  const [nombre, setNombre] = useState((data && data.nombre) || "");
  const [fecha, setFecha] = useState((data && data.fecha) || todayISO());
  const [pesos, setPesos] = useState(() => {
    const inicial = {};
    materiales.forEach((m) => {
      inicial[m] = data && data.pesos && data.pesos[m] != null ? String(data.pesos[m]) : "";
    });
    return inicial;
  });
  const [precioTotal, setPrecioTotal] = useState(data && data.precioTotal != null ? String(data.precioTotal) : "");
  const [notas, setNotas] = useState((data && data.notas) || "");
  const [err, setErr] = useState("");

  function cambiarPeso(material, valor) {
    setPesos((prev) => ({ ...prev, [material]: valor }));
  }

  const pesoTotal = Object.values(pesos).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
  const precioPromedio = pesoTotal > 0 ? (parseFloat(precioTotal) || 0) / pesoTotal : 0;

  function validar() {
    if (!nombre.trim()) return "Escribe un nombre para el lote.";
    if (!fecha) return "Selecciona la fecha.";
    if (pesoTotal <= 0) return "Ingresa el gramaje de al menos una categoria.";
    if (precioTotal === "" || parseFloat(precioTotal) < 0) return "Ingresa el precio del lote.";
    return "";
  }

  function guardar() {
    const problema = validar();
    if (problema) {
      setErr(problema);
      return;
    }
    const pesosFinal = {};
    Object.entries(pesos).forEach(([m, v]) => {
      const num = parseFloat(v) || 0;
      if (num > 0) pesosFinal[m] = num;
    });
    onGuardar({
      id: (data && data.id) || uid(),
      nombre: nombre.trim(),
      fecha,
      pesos: pesosFinal,
      pesoTotal: Math.round(pesoTotal * 100) / 100,
      precioTotal: Math.round(parseFloat(precioTotal) || 0),
      notas: notas.trim(),
      timestamp: (data && data.timestamp) || new Date().toISOString(),
    });
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "crear" ? "Nuevo lote" : "Editar lote"}</h2>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>

        <p className="texto-ayuda">
          Un lote es un pedido de mercaderia que llega ya armado (foto del proveedor). Anota cuantos gramos trae de
          cada categoria y lo que pagaste en total; cada pieza se vende despues, normalmente, cuando la desarmes.
        </p>

        <label className="campo">
          <span>Nombre del lote</span>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Lote 1, Navidad" />
        </label>

        <label className="campo">
          <span>Fecha</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>

        <div className="campo">
          <span>Gramaje por categoria</span>
          <div className="tabla-precios">
            {materiales.map((m) => (
              <div key={m} className="fila-precio">
                <span className="fila-precio-nombre">
                  {iconoMaterial(m)} {m}
                </span>
                <div className="fila-precio-input">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pesos[m] || ""}
                    onChange={(e) => cambiarPeso(m, e.target.value)}
                    placeholder="0"
                  />
                  <span className="unidad">g</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="campo">
          <span>Precio del lote</span>
          <InputDinero value={precioTotal} onChange={setPrecioTotal} placeholder="0" />
        </label>

        <label className="campo">
          <span>Notas (opcional)</span>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalle adicional" />
        </label>

        <div className="resumen-calculo">
          <div>
            <span>Peso total</span>
            <strong>{formatGramos(pesoTotal)}</strong>
          </div>
          <div>
            <span>$/g promedio</span>
            <strong>{formatCLP(precioPromedio)}</strong>
          </div>
        </div>

        {err && <p className="error-texto">{err}</p>}

        <div className="modal-acciones">
          <button className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="btn btn-primario" onClick={guardar}>
            Guardar lote
          </button>
        </div>
      </div>
    </div>
  );
}

function LoteFila({ lote, onEditar, onEliminar }) {
  const [confirmar, setConfirmar] = useState(false);
  const promedio = lote.pesoTotal > 0 ? lote.precioTotal / lote.pesoTotal : 0;
  return (
    <div className="venta-fila">
      <div className="venta-fila-principal">
        <div>
          <div className="venta-material">📦 {lote.nombre}</div>
          <div className="venta-meta">
            <span>{formatFechaCorta(lote.fecha)}</span>
            <span>{formatGramos(lote.pesoTotal)}</span>
          </div>
        </div>
        <div className="venta-ganancia">{formatCLP(lote.precioTotal)}</div>
      </div>
      <div className="venta-fila-detalle">
        <span>{formatCLP(promedio)}/g promedio</span>
        {Object.entries(lote.pesos || {}).map(([m, g]) => (
          <span key={m}>
            {iconoMaterial(m)} {m}: {formatGramos(g)}
          </span>
        ))}
      </div>
      {lote.notas && <div className="venta-notas">{lote.notas}</div>}
      <div className="venta-fila-acciones">
        <button className="link-btn" onClick={onEditar}>
          <Pencil size={13} /> Editar
        </button>
        {!confirmar ? (
          <button className="link-btn link-peligro" onClick={() => setConfirmar(true)}>
            <Trash2 size={13} /> Eliminar
          </button>
        ) : (
          <span className="confirmar-eliminar">
            ¿Eliminar?
            <button className="link-btn link-peligro" onClick={onEliminar}>
              Sí
            </button>
            <button className="link-btn" onClick={() => setConfirmar(false)}>
              No
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

function TabLotes({ lotes, onNuevo, onEditar, onEliminar }) {
  const lotesOrdenados = [...lotes].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.timestamp.localeCompare(a.timestamp)
  );
  const totalInvertido = lotes.reduce((acc, l) => acc + (l.precioTotal || 0), 0);
  const totalGramos = lotes.reduce((acc, l) => acc + (l.pesoTotal || 0), 0);

  return (
    <div>
      <p className="texto-ayuda">
        Registra los lotes de mercaderia que te llegan armados (pedidos ya fotografiados). Anota cuantos gramos
        trae cada categoria y el precio total del lote; la venta se registra en la pestaña "Venta" cuando lo desarmes
        (en las ventas Online la categoria Lotes se activa sola).
      </p>

      <button className="btn btn-primario btn-ancho" onClick={onNuevo}>
        <Plus size={17} /> Registrar lote
      </button>

      <div className="stats-grid">
        <StatCard label="Lotes" valor={lotes.length} />
        <StatCard label="Gramos recibidos" valor={formatGramos(totalGramos)} />
        <StatCard label="Invertido en lotes" valor={formatCLP(totalInvertido)} destacar />
      </div>

      <div className="lista-ventas">
        {lotesOrdenados.length === 0 && <p className="vacio">Aun no registras lotes.</p>}
        {lotesOrdenados.map((l) => (
          <LoteFila key={l.id} lote={l} onEditar={() => onEditar(l)} onEliminar={() => onEliminar(l.id)} />
        ))}
      </div>
    </div>
  );
}

function TabEquipo({ personas, vendedores, pins, comisiones, onGuardarPins, onGuardarComisiones }) {
  const [borradorPins, setBorradorPins] = useState(pins);
  const [guardandoPins, setGuardandoPins] = useState(false);
  const [borradorComisiones, setBorradorComisiones] = useState(comisiones);
  const [guardandoComisiones, setGuardandoComisiones] = useState(false);

  useEffect(() => {
    setBorradorPins(pins);
  }, [pins]);
  useEffect(() => {
    setBorradorComisiones(comisiones);
  }, [comisiones]);

  const hayCambiosPins = JSON.stringify(borradorPins) !== JSON.stringify(pins);
  const hayCambiosComisiones = JSON.stringify(borradorComisiones) !== JSON.stringify(comisiones);

  function cambiarPin(nombre, valor) {
    const limpio = valor.replace(/\D/g, "").slice(0, 4);
    setBorradorPins((prev) => ({ ...prev, [nombre]: limpio }));
  }
  function cambiarComision(nombre, valor) {
    setBorradorComisiones((prev) => ({ ...prev, [nombre]: valor === "" ? "" : Number(valor) }));
  }
  async function guardarPinsClick() {
    setGuardandoPins(true);
    await onGuardarPins(borradorPins);
    setGuardandoPins(false);
  }
  async function guardarComisionesClick() {
    setGuardandoComisiones(true);
    await onGuardarComisiones(borradorComisiones);
    setGuardandoComisiones(false);
  }

  return (
    <div>
      <h3 className="subtitulo">PIN de acceso</h3>
      <p className="texto-ayuda">
        PIN de acceso de cada persona (4 digitos). Es un control basico para separar las vistas de cada uno, no un
        sistema de seguridad: cualquiera con el enlace de esta app puede llegar a esta pantalla.
      </p>
      <div className="tabla-precios">
        {personas.map((nombre) => (
          <div key={nombre} className="fila-precio">
            <span className="fila-precio-nombre">{nombre}</span>
            <input
              className="input-pin"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={borradorPins[nombre] || ""}
              onChange={(e) => cambiarPin(nombre, e.target.value)}
            />
          </div>
        ))}
      </div>
      {hayCambiosPins && (
        <button className="btn btn-primario btn-ancho" onClick={guardarPinsClick} disabled={guardandoPins}>
          {guardandoPins ? "Guardando..." : "Guardar PIN"}
        </button>
      )}

      <h3 className="subtitulo">Comision por venta</h3>
      <p className="texto-ayuda">
        Porcentaje que se descuenta de la ganancia de cada venta de ese vendedor. Dejalo en 0 si no le cobras
        comision. Puedes anotarla o cambiarla cuando quieras.
      </p>
      <div className="tabla-precios">
        {vendedores.map((nombre) => (
          <div key={nombre} className="fila-precio">
            <span className="fila-precio-nombre">{nombre}</span>
            <div className="fila-precio-input">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={borradorComisiones[nombre] != null ? borradorComisiones[nombre] : ""}
                onChange={(e) => cambiarComision(nombre, e.target.value)}
                placeholder="0"
              />
              <span className="unidad">%</span>
            </div>
          </div>
        ))}
      </div>
      {hayCambiosComisiones && (
        <button className="btn btn-primario btn-ancho" onClick={guardarComisionesClick} disabled={guardandoComisiones}>
          {guardandoComisiones ? "Guardando..." : "Guardar comision"}
        </button>
      )}
    </div>
  );
}

/* ---------- app ---------- */

/* ---------- datos en Firebase ---------- */

// Completa la configuracion guardada con los valores iniciales y aplica las migraciones de categorias.
// "faltantes" son las claves que hay que (re)guardar porque no existian o cambiaron al migrarlas.
function prepararConfig(config) {
  const faltantes = [];

  const fusionPrecios = fusionarYEliminarCategorias(config.precios || PRECIOS_INICIALES);
  let precios = fusionPrecios.catalogo;
  if (!config.precios || fusionPrecios.cambio) faltantes.push("precios");
  if (precios["Anillos Microzircon"] == null) {
    precios = { ...precios, "Anillos Microzircon": 950 };
    if (!faltantes.includes("precios")) faltantes.push("precios");
  }

  const fusionReal = fusionarYEliminarCategorias(config.costosReales || COSTOS_REALES_INICIALES);
  let costosReales = fusionReal.catalogo;
  if (!config.costosReales || fusionReal.cambio) faltantes.push("costosReales");
  if (costosReales["Anillos Microzircon"] == null) {
    costosReales = { ...costosReales, "Anillos Microzircon": 0 };
    if (!faltantes.includes("costosReales")) faltantes.push("costosReales");
  }

  let pins = config.pins;
  if (!pins) {
    pins = {};
    PERSONAS.forEach((nombre) => (pins[nombre] = PIN_INICIAL));
    faltantes.push("pins");
  }

  let comisiones = config.comisiones;
  if (!comisiones) {
    comisiones = {};
    VENDEDORES.forEach((nombre) => (comisiones[nombre] = 0));
    faltantes.push("comisiones");
  }

  let lotes = config.lotes;
  if (!lotes) {
    lotes = [];
    faltantes.push("lotes");
  }

  return { precios, costosReales, pins, comisiones, lotes, faltantes };
}

// Mantiene el valor anterior si no cambio, para no reiniciar formularios abiertos (p. ej. Precios) en cada sincronizacion.
function mismoValor(prev, next) {
  return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
}

// Mas recientes primero, en el orden en que se registraron.
function ordenarPorRegistro(lista) {
  return [...lista].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
}

function mensajeErrorDB(e) {
  const code = e && e.code;
  if (code === "sin-config") return "Falta configurar Firebase: completa el archivo firebase-config.js con los datos de tu proyecto.";
  if (code === "permission-denied") {
    return "Firebase rechazó el acceso. Revisa las reglas de Firestore y que el inicio de sesión anónimo esté activado.";
  }
  return "No se pudieron cargar los datos. Revisa tu conexión e intenta de nuevo.";
}

function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [precios, setPrecios] = useState(PRECIOS_INICIALES);
  const [costosReales, setCostosReales] = useState(COSTOS_REALES_INICIALES);
  const [pins, setPins] = useState({});
  const [comisiones, setComisiones] = useState({});
  const [ventas, setVentas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [vista, setVista] = useState("venta");
  const [seccionAjustes, setSeccionAjustes] = useState("precios");
  const [modalVenta, setModalVenta] = useState(null);
  const [modalResumen, setModalResumen] = useState(null);
  const [modalLote, setModalLote] = useState(null);
  const [toast, setToast] = useState(null);
  const dbRef = useRef(null);

  // Los datos viven en Firebase (Firestore) y se escuchan en tiempo real: cada uno ve al instante
  // lo que registran los demas. Ver window.__dbListo en index.html.
  useEffect(() => {
    let cancelado = false;
    const desuscribir = [];
    let configLista = false;
    let ventasListas = false;
    const terminarCarga = () => {
      if (configLista && ventasListas) setLoading(false);
    };
    const alFallar = (e) => {
      if (cancelado) return;
      setLoadError(mensajeErrorDB(e));
      setLoading(false);
    };

    window.__dbListo
      .then((db) => {
        if (cancelado) return;
        dbRef.current = db;
        desuscribir.push(
          db.escucharConfig((config, desdeCache) => {
            const c = prepararConfig(config);
            setPrecios((prev) => mismoValor(prev, c.precios));
            setCostosReales((prev) => mismoValor(prev, c.costosReales));
            setPins((prev) => mismoValor(prev, c.pins));
            setComisiones((prev) => mismoValor(prev, c.comisiones));
            setLotes((prev) => mismoValor(prev, c.lotes));
            // Solo se completan los valores iniciales con datos del servidor: la copia local puede estar incompleta.
            if (!desdeCache) c.faltantes.forEach((clave) => db.guardarConfig(clave, c[clave]).catch(() => {}));
            configLista = true;
            terminarCarga();
          }, alFallar)
        );
        desuscribir.push(
          db.escucharVentas((lista) => {
            setVentas((prev) => mismoValor(prev, ordenarPorRegistro(lista.map(migrarVenta))));
            ventasListas = true;
            terminarCarga();
          }, alFallar)
        );
      })
      .catch(alFallar);

    return () => {
      cancelado = true;
      desuscribir.forEach((fn) => fn());
    };
  }, []);

  // Las ventas se actualizan solas; el boton de actualizar solo lo confirma.
  function refrescarVentas(avisar) {
    if (avisar) setToast("Ventas al día.");
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0);
  }, [vista]);

  useEffect(() => {
    if (usuario) {
      setVista("venta");
      setSeccionAjustes("precios");
    }
  }, [usuario]);

  const esGerente = usuario === GERENTE;
  const temaRosado = usuario === "Joyas BrilliantBlue";

  // Los cambios se ven al instante. Sin internet quedan pendientes y Firebase los sube al volver la conexion;
  // solo se avisa si Firebase los rechaza.
  function avisarSiFalla(promesa) {
    promesa.catch(() => setToast("No se pudo guardar el cambio."));
  }
  function guardarConfig(clave, valor, setter) {
    setter(valor);
    avisarSiFalla(dbRef.current.guardarConfig(clave, valor));
  }

  function agregarVenta(venta) {
    avisarSiFalla(dbRef.current.guardarVenta(venta));
    setToast("Venta guardada.");
  }
  function actualizarVenta(venta) {
    avisarSiFalla(dbRef.current.guardarVenta(venta));
    setToast("Venta actualizada.");
  }
  function eliminarVenta(id) {
    avisarSiFalla(dbRef.current.eliminarVenta(id));
    setToast("Venta eliminada.");
  }
  function confirmarTickets(ids) {
    const fecha = new Date().toISOString();
    const tickets = ventas
      .filter((v) => ids.includes(v.id))
      .map((v) => ({ id: v.id, ticketCosto: { fecha, por: usuario, monto: Math.round(v.costoTotal || 0) } }));
    avisarSiFalla(dbRef.current.ponerTickets(tickets));
    setToast(ids.length === 1 ? "Transferencia confirmada: ticket puesto." : `Transferencia confirmada en ${ids.length} ventas.`);
  }
  function quitarTicket(id) {
    avisarSiFalla(dbRef.current.quitarTicket(id));
    setToast("Ticket quitado.");
  }
  function agregarLote(lote) {
    guardarConfig("lotes", [lote, ...lotes], setLotes);
    setToast("Lote guardado.");
  }
  function actualizarLote(lote) {
    guardarConfig("lotes", lotes.map((l) => (l.id === lote.id ? lote : l)), setLotes);
    setToast("Lote actualizado.");
  }
  function eliminarLote(id) {
    guardarConfig("lotes", lotes.filter((l) => l.id !== id), setLotes);
    setToast("Lote eliminado.");
  }
  function guardarPrecios(nuevos) {
    guardarConfig("precios", nuevos, setPrecios);
    setToast("Precios actualizados.");
  }
  function guardarCostosReales(nuevos) {
    guardarConfig("costosReales", nuevos, setCostosReales);
    setToast("Costos reales actualizados.");
  }
  function guardarPins(nuevos) {
    guardarConfig("pins", nuevos, setPins);
    setToast("PIN actualizados.");
  }
  function guardarComisiones(nuevos) {
    guardarConfig("comisiones", nuevos, setComisiones);
    setToast("Comisiones actualizadas.");
  }

  function abrirEditar(v) {
    setModalVenta({ mode: "editar", data: v });
  }
  // Duplicar: abre el formulario con los mismos datos, fecha de hoy y como venta nueva.
  function abrirDuplicar(v) {
    const copia = {
      ...v,
      id: undefined,
      timestamp: undefined,
      ticketCosto: undefined,
      fecha: todayISO(),
      items: (v.items || []).map((it) => ({ ...it, id: uid() })),
    };
    setModalVenta({ mode: "duplicar", data: copia });
  }
  function abrirResumen(v) {
    setModalResumen(v);
  }
  function abrirNuevoLote() {
    setModalLote({ mode: "crear", data: null });
  }
  function abrirEditarLote(l) {
    setModalLote({ mode: "editar", data: l });
  }

  const tabsActivas = esGerente ? TABS_GERENTE : TABS_VENDEDOR;
  const enAjustes = esGerente && vista === "ajustes";
  const pendientesCosto = esGerente ? costosPendientes(ventas).cantidad : 0;

  return (
    <div className={`app-shell ${temaRosado ? "tema-rosado" : ""}`}>
      <style>{GLOBAL_STYLES}</style>

      {loading && <LoadingScreen />}

      {!loading && loadError && <ErrorScreen msg={loadError} onRetry={() => window.location.reload()} />}

      {!loading && !loadError && !usuario && <LoginScreen personas={PERSONAS} pins={pins} onLogin={setUsuario} />}

      {!loading && !loadError && usuario && (
        <>
          <Header
            usuario={usuario}
            esGerente={esGerente}
            onLogout={() => setUsuario(null)}
            onAjustes={() => setVista((v) => (v === "ajustes" ? "venta" : "ajustes"))}
            ajustesActivo={enAjustes}
          />
          <main className="contenido">
            {/* La pestaña Venta queda montada (oculta) para no perder lo que se está escribiendo al cambiar de pestaña. */}
            <div hidden={vista !== "venta"}>
              <TabVenta
                usuario={usuario}
                esGerente={esGerente}
                precios={precios}
                personas={PERSONAS}
                costosReales={costosReales}
                comisiones={comisiones}
                onGuardar={agregarVenta}
              />
            </div>

            {vista === "historial" && (
              <TabHistorial
                ventas={ventas}
                usuario={usuario}
                esGerente={esGerente}
                personas={PERSONAS}
                comisiones={comisiones}
                costosReales={costosReales}
                onEditar={abrirEditar}
                onDuplicar={abrirDuplicar}
                onEliminar={eliminarVenta}
                onResumen={abrirResumen}
                onConfirmarTickets={confirmarTickets}
                onQuitarTicket={quitarTicket}
                onActualizar={() => refrescarVentas(true)}
              />
            )}

            {vista === "reportes" && esGerente && (
              <TabReportes
                ventas={ventas}
                vendedores={VENDEDORES}
                personas={PERSONAS}
                comisiones={comisiones}
                costosReales={costosReales}
                onToast={setToast}
              />
            )}
            {vista === "reportes" && !esGerente && (
              <TabReportesVendedor usuario={usuario} ventas={ventas} comisiones={comisiones} />
            )}

            {vista === "graficos" && esGerente && <TabGraficos ventas={ventas} personas={PERSONAS} />}

            {enAjustes && (
              <div>
                <h2 className="venta-titulo">Ajustes</h2>
                <div className="filtros-periodo">
                  {SECCIONES_AJUSTES.map((s) => (
                    <button
                      key={s.id}
                      className={`chip ${seccionAjustes === s.id ? "chip-activo" : ""}`}
                      onClick={() => setSeccionAjustes(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {seccionAjustes === "precios" && <TabPrecios precios={precios} onGuardar={guardarPrecios} />}
                {seccionAjustes === "costoreal" && (
                  <TabCostoReal costosReales={costosReales} materiales={Object.keys(precios)} onGuardar={guardarCostosReales} />
                )}
                {seccionAjustes === "lotes" && (
                  <TabLotes lotes={lotes} onNuevo={abrirNuevoLote} onEditar={abrirEditarLote} onEliminar={eliminarLote} />
                )}
                {seccionAjustes === "equipo" && (
                  <TabEquipo
                    personas={PERSONAS}
                    vendedores={VENDEDORES}
                    pins={pins}
                    comisiones={comisiones}
                    onGuardarPins={guardarPins}
                    onGuardarComisiones={guardarComisiones}
                  />
                )}
              </div>
            )}
          </main>

          <nav className="tabbar" aria-label="Navegación principal">
            <div className="tabbar-interior">
              {tabsActivas.map((t) => {
                const Icono = t.icono;
                return (
                  <button key={t.id} className={`tab ${vista === t.id ? "tab-activo" : ""}`} onClick={() => setVista(t.id)}>
                    <span className="tab-icono">
                      <Icono size={20} />
                      {t.id === "historial" && pendientesCosto > 0 && (
                        <span className="tab-badge" title="Costos por confirmar">
                          {pendientesCosto > 99 ? "99+" : pendientesCosto}
                        </span>
                      )}
                    </span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}

      {modalVenta && (
        <VentaForm
          mode={modalVenta.mode}
          data={modalVenta.data}
          usuario={usuario}
          esGerente={esGerente}
          precios={precios}
          personas={PERSONAS}
          costosReales={esGerente ? costosReales : null}
          comisiones={comisiones}
          onCerrar={() => setModalVenta(null)}
          onGuardar={(venta) => {
            if (modalVenta.mode === "editar") {
              actualizarVenta(venta);
              if (modalVenta.data && modalVenta.data.ticketCosto && !venta.ticketCosto) {
                setTimeout(() => setToast("Venta actualizada. Se quitó el ticket del costo porque cambió el costo o quién recibió el pago."), 150);
              }
            } else agregarVenta(venta);
            setModalVenta(null);
          }}
        />
      )}

      {modalResumen && <ResumenClienteModal venta={modalResumen} onCerrar={() => setModalResumen(null)} />}

      {modalLote && (
        <LoteModal
          mode={modalLote.mode}
          data={modalLote.data}
          materiales={Object.keys(precios)}
          onCerrar={() => setModalLote(null)}
          onGuardar={(lote) => {
            if (modalLote.mode === "crear") agregarLote(lote);
            else actualizarLote(lote);
            setModalLote(null);
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
