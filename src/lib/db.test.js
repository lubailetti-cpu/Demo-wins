import { describe, expect, it } from 'vitest'
import { datosDeEjemplo, hayCredenciales, memoriaStore } from './db.js'

describe('hayCredenciales', () => {
  it('detecta cuándo falta configurar Supabase', () => {
    expect(hayCredenciales({})).toBe(false)
    expect(hayCredenciales({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBe(false)
    expect(
      hayCredenciales({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'abc' }),
    ).toBe(true)
  })
})

describe('memoriaStore', () => {
  it('entra con una persona que ya existe, sin duplicarla', async () => {
    const store = memoriaStore()
    const antes = (await store.listarPersonas()).length
    const p = await store.entrar('maría') // en minúscula a propósito
    expect(p.nombre).toBe('María')
    expect((await store.listarPersonas()).length).toBe(antes)
  })

  it('crea el espacio de alguien nuevo', async () => {
    const store = memoriaStore()
    const p = await store.entrar('  Javiera  ')
    expect(p.nombre).toBe('Javiera')
    expect(p.es_lider).toBe(false)
    expect(await store.listarPersonas()).toContainEqual(expect.objectContaining({ nombre: 'Javiera' }))
  })

  it('reconoce a la líder', async () => {
    const store = memoriaStore()
    expect((await store.entrar('Lu')).es_lider).toBe(true)
    expect((await store.entrar('Diego')).es_lider).toBe(false)
  })

  it('agrega un pendiente y queda sin completar', async () => {
    const store = memoriaStore()
    const t = await store.agregarTarea({ persona_id: 2, texto: '  Llamar al proveedor ', fecha_limite: '2026-09-01' })
    expect(t.texto).toBe('Llamar al proveedor')
    expect(t.completada).toBe(false)
    expect((await store.listarTareas()).find((x) => x.id === t.id)).toBeTruthy()
  })

  it('guarda la fecha vacía como nula, no como texto vacío', async () => {
    const store = memoriaStore()
    const t = await store.agregarTarea({ persona_id: 2, texto: 'Sin fecha', fecha_limite: '' })
    expect(t.fecha_limite).toBe(null)
  })

  it('marca y desmarca, y anota cuándo se completó', async () => {
    const store = memoriaStore()
    const t = await store.agregarTarea({ persona_id: 2, texto: 'Probar', fecha_limite: null })

    const marcada = await store.marcarTarea(t.id, true)
    expect(marcada.completada).toBe(true)
    expect(marcada.completada_en).toBeTruthy()

    const desmarcada = await store.marcarTarea(t.id, false)
    expect(desmarcada.completada).toBe(false)
    expect(desmarcada.completada_en).toBe(null)
  })

  it('borra solo el pendiente pedido', async () => {
    const store = memoriaStore()
    const todas = await store.listarTareas()
    await store.borrarTarea(todas[0].id)
    const despues = await store.listarTareas()
    expect(despues.length).toBe(todas.length - 1)
    expect(despues.find((t) => t.id === todas[0].id)).toBeUndefined()
  })

  it('no le cambia los datos a quien no corresponde', async () => {
    const store = memoriaStore()
    const deDiego = (await store.listarTareas()).filter((t) => t.persona_id === 3)
    await store.agregarTarea({ persona_id: 2, texto: 'Algo de María', fecha_limite: null })
    const despues = (await store.listarTareas()).filter((t) => t.persona_id === 3)
    expect(despues).toEqual(deDiego)
  })
})

describe('datosDeEjemplo', () => {
  it('trae equipo con atrasos, para que el tablero se vea vivo', () => {
    const { personas, tareas } = datosDeEjemplo()
    expect(personas.length).toBeGreaterThan(2)
    expect(personas.filter((p) => p.es_lider).length).toBe(1)
    expect(tareas.some((t) => t.completada)).toBe(true)
    expect(tareas.every((t) => personas.some((p) => p.id === t.persona_id))).toBe(true)
  })
})
