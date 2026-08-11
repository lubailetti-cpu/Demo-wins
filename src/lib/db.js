// Capa de datos. Todo lo que la pantalla necesita saber de la base pasa por aquí.
//
// Hay dos implementaciones con la misma forma:
//   - supabaseStore: habla con la base de datos real.
//   - memoriaStore:  guarda en memoria, para probar sin credenciales (modo demo).
//
// La pantalla no sabe cuál está usando, y ese es justamente el punto:
// el día que cambiemos de base de datos, la pantalla no se toca.

import { createClient } from '@supabase/supabase-js'
import { mismoNombre, normalizarNombre } from './tasks.js'

export function hayCredenciales(env = import.meta.env) {
  return Boolean(env?.VITE_SUPABASE_URL && env?.VITE_SUPABASE_ANON_KEY)
}

/* ------------------------------------------------------------------ */
/* Modo demo: en memoria                                               */
/* ------------------------------------------------------------------ */

function diasDesdeHoy(n) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function datosDeEjemplo() {
  const personas = [
    { id: 1, nombre: 'Lu', es_lider: true },
    { id: 2, nombre: 'María', es_lider: false },
    { id: 3, nombre: 'Diego', es_lider: false },
    { id: 4, nombre: 'Camila', es_lider: false },
    { id: 5, nombre: 'Tomás', es_lider: false },
  ]
  const crudas = [
    [1, 'Preparar reunión de equipo del lunes', 1, false],
    [1, 'Revisar presupuesto del trimestre', -1, false],
    [1, 'Actualizar el plan del semestre', -3, true],
    [2, 'Terminar informe de ventas', -2, false],
    [2, 'Coordinar visita a proveedor', 3, false],
    [2, 'Actualizar base de contactos', null, false],
    [2, 'Enviar reporte semanal', -4, true],
    [3, 'Migrar planilla de costos', 2, false],
    [3, 'Revisar cotizaciones recibidas', 4, false],
    [3, 'Cerrar orden de compra 4471', -6, true],
    [4, 'Diseñar propuesta para cliente nuevo', 0, false],
    [4, 'Mandar mockups a revisión', -1, false],
    [4, 'Ordenar carpeta de marca', 7, false],
    [5, 'Inventario de bodega norte', -5, false],
    [5, 'Agendar mantención de equipos', 6, false],
  ]
  const tareas = crudas.map(([persona_id, texto, offset, completada], i) => ({
    id: i + 1,
    persona_id,
    texto,
    fecha_limite: offset === null ? null : diasDesdeHoy(offset),
    completada,
    completada_en: completada ? new Date().toISOString() : null,
  }))
  return { personas, tareas }
}

export function memoriaStore(semilla = datosDeEjemplo()) {
  let personas = semilla.personas.map((p) => ({ ...p }))
  let tareas = semilla.tareas.map((t) => ({ ...t }))
  let siguienteId = Math.max(0, ...tareas.map((t) => t.id)) + 1
  let siguientePersona = Math.max(0, ...personas.map((p) => p.id)) + 1

  return {
    modo: 'demo',

    async listarPersonas() {
      return personas.map((p) => ({ ...p }))
    },

    async entrar(nombre) {
      const limpio = normalizarNombre(nombre)
      const existente = personas.find((p) => mismoNombre(p.nombre, limpio))
      if (existente) return { ...existente }
      const nueva = { id: siguientePersona++, nombre: limpio, es_lider: false }
      personas.push(nueva)
      return { ...nueva }
    },

    async listarTareas() {
      return tareas.map((t) => ({ ...t }))
    },

    async agregarTarea({ persona_id, texto, fecha_limite }) {
      const nueva = {
        id: siguienteId++,
        persona_id,
        texto: texto.trim(),
        fecha_limite: fecha_limite || null,
        completada: false,
        completada_en: null,
      }
      tareas = [nueva, ...tareas]
      return { ...nueva }
    },

    async marcarTarea(id, completada) {
      tareas = tareas.map((t) =>
        t.id === id
          ? { ...t, completada, completada_en: completada ? new Date().toISOString() : null }
          : t,
      )
      return tareas.find((t) => t.id === id)
    },

    async borrarTarea(id) {
      tareas = tareas.filter((t) => t.id !== id)
    },
  }
}

/* ------------------------------------------------------------------ */
/* Modo real: Supabase                                                 */
/* ------------------------------------------------------------------ */

function reventar(error, quehacia) {
  if (error) throw new Error(`No se pudo ${quehacia}: ${error.message}`)
}

export function supabaseStore(cliente) {
  return {
    modo: 'supabase',

    async listarPersonas() {
      const { data, error } = await cliente.from('personas').select('*').order('nombre')
      reventar(error, 'cargar las personas')
      return data ?? []
    },

    async entrar(nombre) {
      const limpio = normalizarNombre(nombre)

      const { data: existentes, error: errorBusqueda } = await cliente
        .from('personas')
        .select('*')
        .ilike('nombre', limpio)
        .limit(1)
      reventar(errorBusqueda, 'buscar tu nombre')
      if (existentes && existentes.length > 0) return existentes[0]

      const { data: creada, error: errorAlta } = await cliente
        .from('personas')
        .insert({ nombre: limpio })
        .select()
        .single()
      reventar(errorAlta, 'crear tu espacio')
      return creada
    },

    async listarTareas() {
      const { data, error } = await cliente
        .from('pendientes')
        .select('*')
        .order('creada_en', { ascending: false })
      reventar(error, 'cargar los pendientes')
      return data ?? []
    },

    async agregarTarea({ persona_id, texto, fecha_limite }) {
      const { data, error } = await cliente
        .from('pendientes')
        .insert({ persona_id, texto: texto.trim(), fecha_limite: fecha_limite || null })
        .select()
        .single()
      reventar(error, 'guardar el pendiente')
      return data
    },

    async marcarTarea(id, completada) {
      const { data, error } = await cliente
        .from('pendientes')
        .update({ completada, completada_en: completada ? new Date().toISOString() : null })
        .eq('id', id)
        .select()
        .single()
      reventar(error, 'marcar el pendiente')
      return data
    },

    async borrarTarea(id) {
      const { error } = await cliente.from('pendientes').delete().eq('id', id)
      reventar(error, 'borrar el pendiente')
    },
  }
}

/** Elige el modo según haya credenciales o no. */
export function crearStore(env = import.meta.env) {
  if (!hayCredenciales(env)) return memoriaStore()
  const cliente = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  return supabaseStore(cliente)
}
