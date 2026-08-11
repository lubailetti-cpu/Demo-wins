# Planner de equipo

Aplicación web donde cada persona lleva sus pendientes y la líder ve el avance de todo el equipo.

Construida en el Laboratorio Code de Tidú.

## Cómo correrla en tu computadora

```bash
npm install     # descarga las piezas que necesita, se hace una sola vez
npm run dev     # la levanta y te da una dirección para abrir en el navegador
```

Arranca en **modo demo**, con un equipo de ejemplo que se borra al recargar. Sirve para
mirarla sin configurar nada.

## Cómo conectarla a la base de datos

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Abre el **SQL Editor**, pega el contenido de `supabase/schema.sql` y dale a **Run**.
   Eso crea las tablas y las reglas de acceso.
3. Copia el archivo `.env.example` como `.env` y rellena los dos valores. Los sacas de
   tu proyecto en Supabase, en **Settings > API**.
4. Vuelve a correr `npm run dev`. El aviso de modo demo desaparece.

El archivo `.env` no se sube a GitHub, a propósito. La llave se trata como una contraseña.

## Cómo se prueba

```bash
npm test                  # revisa la lógica de cálculo y la capa de datos
npm run build             # compila la versión de producción
npm run preview           # la sirve en localhost:4173
node scripts/humo.mjs     # la abre en un navegador real y recorre los caminos principales
```

La prueba de humo necesita la aplicación corriendo con `npm run preview`.

## Cómo está organizado

| Carpeta | Qué hay adentro |
|---|---|
| `src/lib/tasks.js` | La lógica de cálculo: qué está atrasado, cómo se ordena, cuánto se avanzó |
| `src/lib/db.js` | La conversación con la base de datos, con su modo demo |
| `src/components/` | Las piezas de la pantalla |
| `supabase/schema.sql` | Las tablas y las reglas de acceso |
| `scripts/humo.mjs` | La prueba que abre un navegador de verdad |

La lógica de cálculo vive separada de la pantalla a propósito: así se puede probar sola,
y el día que cambie el diseño, los cálculos no se tocan.

## Lo que falta

- Ambiente de prueba separado de producción
- Publicarla en internet
- Login real y dominio propio, anotados como fase 2
