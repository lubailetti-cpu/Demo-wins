import { useState } from 'react'
import Tarea from './Tarea.jsx'
import { ordenarPorFecha, resumen } from '../lib/tasks.js'

export default function MiLista({ persona, tareas, onAgregar, onMarcar, onBorrar }) {
  const [texto, setTexto] = useState('')
  const [fecha, setFecha] = useState('')

  const s = resumen(tareas)
  const pendientes = ordenarPorFecha(tareas.filter((t) => !t.completada))
  const completadas = tareas.filter((t) => t.completada)

  async function agregar(e) {
    e.preventDefault()
    const limpio = texto.trim()
    if (!limpio) return
    await onAgregar({ texto: limpio, fecha_limite: fecha || null })
    setTexto('')
    setFecha('')
  }

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Hola, {persona.nombre}</h2>
          <p>
            {s.pendientes === 0
              ? 'No te queda nada pendiente. Buen día.'
              : `Te quedan ${s.pendientes} pendientes${
                  s.atrasadas ? `, ${s.atrasadas} con fecha vencida.` : '.'
                }`}
          </p>
        </div>
      </div>

      <div className="tiles">
        <div className="tile">
          <span className="k">Pendientes</span>
          <span className="v tnum">{s.pendientes}</span>
        </div>
        <div className="tile good">
          <span className="k">Completadas</span>
          <span className="v tnum">{s.completadas}</span>
        </div>
        <div className={`tile ${s.atrasadas ? 'alert' : ''}`}>
          <span className="k">Atrasadas</span>
          <span className="v tnum">{s.atrasadas}</span>
        </div>
        <div className="tile">
          <span className="k">Avance</span>
          <span className="v tnum">{s.avance}%</span>
          <div className="bar" style={{ marginTop: 8 }}>
            <i style={{ width: `${s.avance}%` }} />
          </div>
        </div>
      </div>

      <div className="card">
        <form className="addrow" onSubmit={agregar}>
          <input
            type="text"
            placeholder="¿Qué tienes que hacer?"
            autoComplete="off"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            required
          />
          <input
            type="date"
            aria-label="Fecha límite"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <button className="btn" type="submit">
            Agregar
          </button>
        </form>

        <div className="grouphead">
          Por hacer <span className="count tnum">{pendientes.length}</span>
        </div>
        {pendientes.length > 0 ? (
          <ul className="tasks">
            {pendientes.map((t) => (
              <Tarea key={t.id} tarea={t} editable onMarcar={onMarcar} onBorrar={onBorrar} />
            ))}
          </ul>
        ) : (
          <p className="empty">Nada por hacer. Agrega tu primer pendiente arriba.</p>
        )}

        {completadas.length > 0 && (
          <>
            <div className="grouphead">
              Completadas <span className="count tnum">{completadas.length}</span>
            </div>
            <ul className="tasks">
              {completadas.map((t) => (
                <Tarea key={t.id} tarea={t} editable onMarcar={onMarcar} onBorrar={onBorrar} />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
