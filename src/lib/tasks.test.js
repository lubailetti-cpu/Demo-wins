import { describe, expect, it } from 'vitest'
import {
  dueState,
  estaAtrasada,
  iniciales,
  mismoNombre,
  ordenarPorFecha,
  resumen,
  resumenPorPersona,
} from './tasks.js'

const HOY = new Date(2026, 7, 11) // 11 de agosto de 2026

function tarea(extra = {}) {
  return { id: 1, persona_id: 1, texto: 'algo', fecha_limite: null, completada: false, ...extra }
}

describe('dueState', () => {
  it('marca como atrasado lo que venció', () => {
    expect(dueState('2026-08-10', HOY)).toMatchObject({ cls: 'late', label: '1 día tarde' })
    expect(dueState('2026-08-08', HOY)).toMatchObject({ cls: 'late', label: '3 días tarde' })
  })

  it('reconoce hoy y mañana', () => {
    expect(dueState('2026-08-11', HOY)).toMatchObject({ cls: 'today', label: 'hoy' })
    expect(dueState('2026-08-12', HOY)).toMatchObject({ cls: 'soon', label: 'mañana' })
  })

  it('aguanta que no haya fecha', () => {
    expect(dueState(null, HOY)).toMatchObject({ cls: 'none', label: 'sin fecha' })
    expect(dueState('', HOY)).toMatchObject({ cls: 'none' })
  })

  it('no se corre de día por la zona horaria', () => {
    // Con new Date("2026-08-11") el navegador interpreta UTC y en Chile
    // mostraría el día anterior. Por eso parseamos a mano.
    expect(dueState('2026-08-11', HOY).cls).toBe('today')
  })
})

describe('estaAtrasada', () => {
  it('una tarea completada nunca cuenta como atrasada', () => {
    expect(estaAtrasada(tarea({ fecha_limite: '2026-08-01', completada: true }), HOY)).toBe(false)
  })

  it('una tarea sin fecha nunca cuenta como atrasada', () => {
    expect(estaAtrasada(tarea({ fecha_limite: null }), HOY)).toBe(false)
  })

  it('la de hoy todavía no está atrasada', () => {
    expect(estaAtrasada(tarea({ fecha_limite: '2026-08-11' }), HOY)).toBe(false)
  })

  it('la de ayer sí', () => {
    expect(estaAtrasada(tarea({ fecha_limite: '2026-08-10' }), HOY)).toBe(true)
  })
})

describe('ordenarPorFecha', () => {
  it('pone lo más urgente arriba y lo sin fecha al final', () => {
    const lista = [
      tarea({ id: 1, fecha_limite: null }),
      tarea({ id: 2, fecha_limite: '2026-08-20' }),
      tarea({ id: 3, fecha_limite: '2026-08-01' }),
    ]
    expect(ordenarPorFecha(lista).map((t) => t.id)).toEqual([3, 2, 1])
  })

  it('no modifica la lista original', () => {
    const lista = [tarea({ id: 1, fecha_limite: '2026-09-01' }), tarea({ id: 2, fecha_limite: '2026-08-01' })]
    ordenarPorFecha(lista)
    expect(lista.map((t) => t.id)).toEqual([1, 2])
  })
})

describe('resumen', () => {
  it('cuenta pendientes, completadas, atrasadas y avance', () => {
    const lista = [
      tarea({ id: 1, completada: true }),
      tarea({ id: 2, fecha_limite: '2026-08-01' }),
      tarea({ id: 3, fecha_limite: '2026-12-01' }),
      tarea({ id: 4 }),
    ]
    expect(resumen(lista, HOY)).toEqual({
      total: 4,
      completadas: 1,
      pendientes: 3,
      atrasadas: 1,
      avance: 25,
    })
  })

  it('no divide por cero con la lista vacía', () => {
    expect(resumen([], HOY)).toEqual({ total: 0, completadas: 0, pendientes: 0, atrasadas: 0, avance: 0 })
  })
})

describe('resumenPorPersona', () => {
  it('reparte las tareas a quien corresponde', () => {
    const personas = [
      { id: 1, nombre: 'Lu' },
      { id: 2, nombre: 'María' },
    ]
    const lista = [
      tarea({ id: 1, persona_id: 1, completada: true }),
      tarea({ id: 2, persona_id: 2 }),
      tarea({ id: 3, persona_id: 2, fecha_limite: '2026-08-01' }),
    ]
    const filas = resumenPorPersona(personas, lista, HOY)
    expect(filas[0].resumen.avance).toBe(100)
    expect(filas[1].resumen.pendientes).toBe(2)
    expect(filas[1].resumen.atrasadas).toBe(1)
  })
})

describe('nombres', () => {
  it('saca iniciales de uno o dos nombres', () => {
    expect(iniciales('Lu')).toBe('L')
    expect(iniciales('María José')).toBe('MJ')
    expect(iniciales('  ana  maría  soto ')).toBe('AM')
  })

  it('compara nombres sin importar mayúsculas ni espacios de más', () => {
    expect(mismoNombre('maría', 'María')).toBe(true)
    expect(mismoNombre('  Lu ', 'lu')).toBe(true)
    expect(mismoNombre('Lu', 'Luis')).toBe(false)
  })
})
