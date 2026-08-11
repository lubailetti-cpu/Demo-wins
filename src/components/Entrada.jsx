import { useState } from 'react'

export default function Entrada({ personas, modoDemo, onEntrar, error }) {
  const [nombre, setNombre] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const limpio = nombre.trim()
    if (!limpio || enviando) return
    setEnviando(true)
    await onEntrar(limpio)
    setEnviando(false)
  }

  return (
    <div className="gate">
      <h1>Tu planner de equipo</h1>
      <p>Escribe tu nombre para entrar a tu espacio. Cada quien ve y ordena sus propios pendientes.</p>

      {error && <p className="error">{error}</p>}

      <form onSubmit={enviar}>
        <div className="field">
          <label htmlFor="nombre">Tu nombre</label>
          <input
            id="nombre"
            type="text"
            autoComplete="off"
            placeholder="Por ejemplo, María"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {personas.length > 0 && (
        <div className="hint">
          {modoDemo
            ? 'Estás en modo demo: los datos son de ejemplo y se borran al recargar. Entra con cualquiera de estos nombres:'
            : 'Ya tienen espacio en esta herramienta:'}
          <div className="chips">
            {personas.map((p) => (
              <button key={p.id} className="chip" type="button" onClick={() => onEntrar(p.nombre)}>
                {p.nombre}
                {p.es_lider ? ' (líder)' : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
