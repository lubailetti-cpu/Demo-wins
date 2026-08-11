import { useEffect, useMemo, useState } from 'react'
import Entrada from './components/Entrada.jsx'
import MiLista from './components/MiLista.jsx'
import Tablero from './components/Tablero.jsx'
import { crearStore } from './lib/db.js'
import { iniciales } from './lib/tasks.js'

export default function App() {
  const store = useMemo(() => crearStore(), [])

  const [personas, setPersonas] = useState([])
  const [tareas, setTareas] = useState([])
  const [persona, setPersona] = useState(null)
  const [vista, setVista] = useState('mias')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function recargar() {
    const [ps, ts] = await Promise.all([store.listarPersonas(), store.listarTareas()])
    setPersonas(ps)
    setTareas(ts)
  }

  useEffect(() => {
    recargar()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function entrar(nombre) {
    try {
      setError('')
      const p = await store.entrar(nombre)
      setPersona(p)
      setVista(p.es_lider ? 'equipo' : 'mias')
      await recargar()
    } catch (e) {
      setError(e.message)
    }
  }

  function salir() {
    setPersona(null)
    setVista('mias')
  }

  async function conError(accion) {
    try {
      setError('')
      await accion()
      await recargar()
    } catch (e) {
      setError(e.message)
    }
  }

  const agregar = ({ texto, fecha_limite }) =>
    conError(() => store.agregarTarea({ persona_id: persona.id, texto, fecha_limite }))

  const marcar = (tarea) => conError(() => store.marcarTarea(tarea.id, !tarea.completada))

  const borrar = (tarea) => conError(() => store.borrarTarea(tarea.id))

  if (cargando) return <p className="loading">Cargando tus pendientes...</p>

  if (!persona) {
    return (
      <Entrada personas={personas} modoDemo={store.modo === 'demo'} onEntrar={entrar} error={error} />
    )
  }

  const mias = tareas.filter((t) => t.persona_id === persona.id)

  return (
    <>
      {store.modo === 'demo' && (
        <p className="banner">
          Modo demo: los datos son de ejemplo y se borran al recargar. Falta conectar Supabase.
        </p>
      )}

      <header className="topbar">
        <span className="brandmark">
          <strong>Planner</strong>
          <span>Equipo</span>
        </span>

        {persona.es_lider && (
          <div className="switch" role="group" aria-label="Cambiar vista">
            <button aria-pressed={vista === 'mias'} onClick={() => setVista('mias')}>
              Mis pendientes
            </button>
            <button aria-pressed={vista === 'equipo'} onClick={() => setVista('equipo')}>
              Tablero del equipo
            </button>
          </div>
        )}

        <div className="whoami">
          <span className="avatar">{iniciales(persona.nombre)}</span>
          <button className="linkbtn" onClick={salir}>
            Salir
          </button>
        </div>
      </header>

      <main>
        {error && <p className="error">{error}</p>}

        {vista === 'equipo' && persona.es_lider ? (
          <Tablero persona={persona} personas={personas} tareas={tareas} />
        ) : (
          <MiLista
            persona={persona}
            tareas={mias}
            onAgregar={agregar}
            onMarcar={marcar}
            onBorrar={borrar}
          />
        )}
      </main>
    </>
  )
}
