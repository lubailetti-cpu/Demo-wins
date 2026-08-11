// Lógica de cálculo de los pendientes.
// Vive separada de la pantalla a propósito: así se puede probar sola.

/** Devuelve la fecha de hoy a medianoche, para comparar sin que estorbe la hora. */
export function startOfToday(now = new Date()) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Convierte "2026-08-11" en una fecha local, sin corrimiento por zona horaria. */
export function parseDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/**
 * Estado de una fecha límite respecto de hoy.
 * Devuelve { cls, label, diasDeAtraso }.
 */
export function dueState(iso, today = startOfToday()) {
  const d = parseDate(iso)
  if (!d) return { cls: 'none', label: 'sin fecha', diasDeAtraso: 0 }

  const diff = Math.round((d - today) / 86400000)
  if (diff < 0) {
    const dias = Math.abs(diff)
    return { cls: 'late', label: dias === 1 ? '1 día tarde' : `${dias} días tarde`, diasDeAtraso: dias }
  }
  if (diff === 0) return { cls: 'today', label: 'hoy', diasDeAtraso: 0 }
  if (diff === 1) return { cls: 'soon', label: 'mañana', diasDeAtraso: 0 }
  return {
    cls: 'future',
    label: d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
    diasDeAtraso: 0,
  }
}

export function estaAtrasada(tarea, today = startOfToday()) {
  if (tarea.completada) return false
  const d = parseDate(tarea.fecha_limite)
  return d !== null && d < today
}

/** Pendientes sin fecha al final; el resto, lo más urgente arriba. */
export function ordenarPorFecha(tareas) {
  return [...tareas].sort((a, b) => {
    if (!a.fecha_limite && !b.fecha_limite) return 0
    if (!a.fecha_limite) return 1
    if (!b.fecha_limite) return -1
    if (a.fecha_limite === b.fecha_limite) return 0
    return a.fecha_limite < b.fecha_limite ? -1 : 1
  })
}

/** Resumen de una lista: cuántas van, cuántas faltan, cuántas atrasadas y el avance. */
export function resumen(tareas, today = startOfToday()) {
  const total = tareas.length
  const completadas = tareas.filter((t) => t.completada).length
  const atrasadas = tareas.filter((t) => estaAtrasada(t, today)).length
  return {
    total,
    completadas,
    pendientes: total - completadas,
    atrasadas,
    avance: total === 0 ? 0 : Math.round((completadas / total) * 100),
  }
}

/** Agrupa las tareas de todo el equipo por persona, con su resumen. */
export function resumenPorPersona(personas, tareas, today = startOfToday()) {
  return personas.map((persona) => {
    const suyas = tareas.filter((t) => t.persona_id === persona.id)
    return { persona, tareas: suyas, resumen: resumen(suyas, today) }
  })
}

export function iniciales(nombre) {
  return String(nombre)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase()
}

/** Normaliza el nombre para comparar sin importar mayúsculas ni espacios de más. */
export function normalizarNombre(nombre) {
  return String(nombre).trim().replace(/\s+/g, ' ')
}

export function mismoNombre(a, b) {
  return normalizarNombre(a).toLocaleLowerCase() === normalizarNombre(b).toLocaleLowerCase()
}
