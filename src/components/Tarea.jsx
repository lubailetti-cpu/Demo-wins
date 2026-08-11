import { dueState } from '../lib/tasks.js'

export default function Tarea({ tarea, editable, onMarcar, onBorrar }) {
  const fecha = dueState(tarea.fecha_limite)
  const mostrarFecha = Boolean(tarea.fecha_limite) || !tarea.completada

  return (
    <li className={tarea.completada ? 'is-done' : ''}>
      <button
        className="tick"
        aria-pressed={tarea.completada}
        aria-label={tarea.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
        onClick={() => onMarcar(tarea)}
        disabled={!editable}
      >
        <svg viewBox="0 0 14 14" aria-hidden="true">
          <polyline points="2,7 6,11 12,3" />
        </svg>
      </button>

      <span className="task-title">{tarea.texto}</span>

      {mostrarFecha && <span className={`due ${fecha.cls} tnum`}>{fecha.label}</span>}

      {editable && (
        <button className="del" aria-label="Borrar pendiente" onClick={() => onBorrar(tarea)}>
          ✕
        </button>
      )}
    </li>
  )
}
