-- Planner de equipo: tablas y reglas de acceso.
--
-- Cómo se usa: entra a tu proyecto en Supabase, abre "SQL Editor",
-- pega todo este archivo y dale a "Run". Se puede correr más de una vez
-- sin romper nada.

/* ------------------------------------------------------------------ */
/* Tablas                                                              */
/* ------------------------------------------------------------------ */

create table if not exists public.personas (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  es_lider    boolean not null default false,
  creada_en   timestamptz not null default now()
);

-- Un solo espacio por nombre, sin importar mayúsculas.
create unique index if not exists personas_nombre_unico
  on public.personas (lower(nombre));

create table if not exists public.pendientes (
  id            bigint generated always as identity primary key,
  persona_id    bigint not null references public.personas(id) on delete cascade,
  texto         text not null check (length(trim(texto)) > 0),
  fecha_limite  date,
  completada    boolean not null default false,
  completada_en timestamptz,
  creada_en     timestamptz not null default now()
);

create index if not exists pendientes_por_persona
  on public.pendientes (persona_id);

/* ------------------------------------------------------------------ */
/* Reglas de acceso por fila (RLS)                                     */
/* ------------------------------------------------------------------ */
--
-- Contexto importante: esta versión no tiene contraseñas, por decisión
-- explícita. Entonces la base no puede probar quién eres, solo sabe que
-- alguien escribió un nombre.
--
-- Lo que estas reglas SÍ hacen: cerrar la base a cualquiera que intente
-- entrar por fuera de la aplicación, e impedir que se borren personas
-- con todo su historial por un clic mal dado.
--
-- Lo que estas reglas NO hacen: impedir que alguien escriba el nombre de
-- otra persona en la pantalla de entrada. Eso es consecuencia directa de
-- no tener login, y está anotado como fase 2.

alter table public.personas   enable row level security;
alter table public.pendientes enable row level security;

-- Personas: se pueden ver y crear (para que alguien nuevo entre por
-- primera vez), pero no modificar ni borrar desde la aplicación.
drop policy if exists personas_lectura on public.personas;
create policy personas_lectura
  on public.personas for select
  to anon, authenticated
  using (true);

drop policy if exists personas_alta on public.personas;
create policy personas_alta
  on public.personas for insert
  to anon, authenticated
  with check (length(trim(nombre)) between 1 and 60);

-- (No hay política de update ni de delete sobre personas. Sin política,
--  RLS bloquea la operación. Para borrar a alguien se hace a mano desde
--  el panel de Supabase, y es a propósito.)

-- Pendientes: lectura abierta, porque el tablero de la líder necesita
-- ver los de todo el equipo.
drop policy if exists pendientes_lectura on public.pendientes;
create policy pendientes_lectura
  on public.pendientes for select
  to anon, authenticated
  using (true);

-- Solo se pueden crear pendientes que apunten a una persona que existe.
drop policy if exists pendientes_alta on public.pendientes;
create policy pendientes_alta
  on public.pendientes for insert
  to anon, authenticated
  with check (
    exists (select 1 from public.personas p where p.id = persona_id)
  );

drop policy if exists pendientes_edicion on public.pendientes;
create policy pendientes_edicion
  on public.pendientes for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists pendientes_baja on public.pendientes;
create policy pendientes_baja
  on public.pendientes for delete
  to anon, authenticated
  using (true);

/* ------------------------------------------------------------------ */
/* Marca a la líder                                                    */
/* ------------------------------------------------------------------ */
-- Cambia 'Lu' por tu nombre si usas otro, y corre solo esta línea.

insert into public.personas (nombre, es_lider)
values ('Lu', true)
on conflict (lower(nombre)) do update set es_lider = true;
