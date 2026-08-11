// Prueba de humo: abre la aplicación en un navegador de verdad y revisa
// que los caminos importantes funcionen de punta a punta.
//
// Se llama "de humo" por la idea de encender algo y ver si sale humo:
// no prueba todo, prueba que lo esencial no está roto.
//
// Uso: node scripts/humo.mjs  (con la aplicación corriendo en localhost:4173)

import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:4173'
const pasos = []

function ok(nombre) { pasos.push(['ok', nombre]) }
function falla(nombre, detalle) { pasos.push(['falla', `${nombre} (${detalle})`]) }

async function revisar(nombre, fn) {
  try {
    await fn()
    ok(nombre)
  } catch (e) {
    falla(nombre, e.message.split('\n')[0])
  }
}

const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium'
const navegador = await chromium.launch({ executablePath: CHROME })
const pagina = await navegador.newPage()

const errores = []
pagina.on('pageerror', (e) => errores.push(e.message))
pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })

await pagina.goto(URL, { waitUntil: 'networkidle' })

await revisar('la pantalla de entrada carga', async () => {
  await pagina.getByRole('heading', { name: 'Tu planner de equipo' }).waitFor({ timeout: 5000 })
})

await revisar('avisa que está en modo demo', async () => {
  await pagina.getByText('modo demo', { exact: false }).first().waitFor({ timeout: 3000 })
})

await revisar('una persona del equipo entra y ve sus pendientes', async () => {
  await pagina.getByRole('button', { name: 'María' }).click()
  await pagina.getByRole('heading', { name: 'Hola, María' }).waitFor({ timeout: 5000 })
})

await revisar('una persona del equipo NO ve el tablero de líder', async () => {
  const tablero = pagina.getByRole('button', { name: 'Tablero del equipo' })
  if (await tablero.count()) throw new Error('el switch de líder aparece y no debería')
})

await revisar('agregar un pendiente lo deja en la lista', async () => {
  await pagina.getByPlaceholder('¿Qué tienes que hacer?').fill('Pendiente de prueba')
  await pagina.getByRole('button', { name: 'Agregar' }).click()
  await pagina.getByText('Pendiente de prueba').waitFor({ timeout: 5000 })
})

await revisar('marcar un pendiente lo mueve a completadas', async () => {
  const fila = pagina.locator('li', { hasText: 'Pendiente de prueba' }).first()
  await fila.getByRole('button', { name: 'Marcar como completada' }).click()
  await pagina.locator('li.is-done', { hasText: 'Pendiente de prueba' }).waitFor({ timeout: 5000 })
})

await revisar('los números del resumen se mueven al marcar', async () => {
  const completadas = pagina.locator('.tile', { hasText: 'Completadas' }).locator('.v')
  const valor = Number(await completadas.textContent())
  if (!(valor >= 1)) throw new Error(`el contador de completadas quedó en ${valor}`)
})

await revisar('la líder entra y ve el tablero del equipo', async () => {
  await pagina.getByRole('button', { name: 'Salir' }).click()
  await pagina.getByRole('button', { name: 'Lu (líder)' }).click()
  await pagina.getByRole('heading', { name: 'Avance del equipo' }).waitFor({ timeout: 5000 })
})

await revisar('el tablero muestra a todo el equipo', async () => {
  const tarjetas = await pagina.locator('details.person').count()
  if (tarjetas < 3) throw new Error(`solo aparecen ${tarjetas} personas`)
})

await revisar('las personas con atrasos quedan marcadas y abiertas', async () => {
  const conAtraso = pagina.locator('details.person.has-late').first()
  await conAtraso.waitFor({ timeout: 3000 })
  if (!(await conAtraso.getAttribute('open')) === null) return
  const abierta = await conAtraso.evaluate((el) => el.open)
  if (!abierta) throw new Error('la tarjeta con atrasos no se abrió sola')
})

await revisar('la líder puede volver a sus propios pendientes', async () => {
  await pagina.getByRole('button', { name: 'Mis pendientes' }).click()
  await pagina.getByRole('heading', { name: 'Hola, Lu' }).waitFor({ timeout: 5000 })
})

await revisar('no hay errores en la consola del navegador', async () => {
  if (errores.length) throw new Error(errores.join(' | ').slice(0, 200))
})

await navegador.close()

const fallas = pasos.filter(([estado]) => estado === 'falla')
for (const [estado, nombre] of pasos) {
  console.log(`${estado === 'ok' ? '  ok  ' : ' FALLA'}  ${nombre}`)
}
console.log(`\n${pasos.length - fallas.length}/${pasos.length} pasos correctos`)
process.exit(fallas.length ? 1 : 0)
