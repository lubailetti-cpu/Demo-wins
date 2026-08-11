import Tarea from './Tarea.jsx'
import { iniciales, ordenarPorFecha, resumen, resumenPorPersona } from '../lib/tasks.js'

export default function Tablero({ persona, personas, tareas }) {
  const total = resumen(tareas)
  const filas = resumenPorPersona(personas, tareas)
  const conAtraso = filas.filter((f) => f.resumen.atrasadas > 0).map((f) => f.persona.nombre)

  return (
    <>
      <div className="pagehead">
        <div>
          <h2>Avance del equipo</h2>
          <p>
            {conAtraso.length > 0
              ? `Hay ${conAtraso.length} ${
                  conAtraso.length === 1 ? 'persona' : 'personas'
                } con pendientes vencidos: ${conAtraso.join(', ')}.`
              : 'Nadie tiene pendientes vencidos.'}
          </p>
        </div>
      </div>

      <div className="tiles">
        <div className="tile">
          <span className="k">Personas</span>
          <span className="v tnum">{personas.length}</span>
        </div>
        <div className="tile">
          <span className="k">Pendientes</span>
          <span className="v tnum">{total.pendientes}</span>
        </div>
        <div className={`tile ${total.atrasadas ? 'alert' : ''}`}>
          <span className="k">Atrasados</span>
          <span className="v tnum">{total.atrasadas}</span>
        </div>
        <div className="tile">
          <span className="k">Avance</span>
          <span className="v tnum">{total.avance}%</span>
          <div className="bar" style={{ marginTop: 8 }}>
            <i style={{ width: `${total.avance}%` }} />
          </div>
        </div>
      </div>

      <div className="people">
        {filas.map(({ persona: p, tareas: suyas, resumen: r }) => {
          const abiertas = ordenarPorFecha(suyas.filter((t) => !t.completada))
          return (
            <details key={p.id} className={`person ${r.atrasadas ? 'has-late' : ''}`} open={r.atrasadas > 0}>
              <summary>
                <span className="avatar">{iniciales(p.nombre)}</span>
                <span>
                  <span className="pname">
                    {p.nombre}
                    {p.id === persona.id ? ' (tú)' : ''}
                  </span>
                  <span className="pmeta">
                    <span className="tnum">
                      {r.pendientes} por hacer, {r.completadas} listas
                    </span>
                    {r.atrasadas > 0 ? (
                      <span className="flag tnum">
                        {r.atrasadas} atrasada{r.atrasadas > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="flag ok">al día</span>
                    )}
                  </span>
                </span>
                <span className="pprogress">
                  <span className="bar">
                    <i style={{ width: `${r.avance}%` }} />
                  </span>
                  <span className="pct tnum">{r.avance}%</span>
                </span>
              </summary>

              <div className="detail">
                {abiertas.length > 0 ? (
                  <ul className="tasks">
                    {abiertas.map((t) => (
                      <Tarea key={t.id} tarea={t} editable={false} onMarcar={() => {}} onBorrar={() => {}} />
                    ))}
                  </ul>
                ) : (
                  <p className="empty">Sin pendientes. Todo cerrado.</p>
                )}
              </div>
            </details>
          )
        })}
      </div>

      <p className="note">
        <b>Cómo leer esto:</b> las tarjetas con borde rojo tienen pendientes con fecha vencida, y se
        abren solas para que veas de inmediato qué es. El resto queda cerrado para no llenarte la
        pantalla.
      </p>
    </>
  )
}
