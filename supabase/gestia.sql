create table if not exists perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('estudiante_docente', 'tecnico', 'administrador')),
  created_at timestamptz not null default now()
);

create table if not exists ubicaciones (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

create table if not exists categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

create table if not exists reportes (
  id bigint generated always as identity primary key,
  titulo text not null,
  descripcion text not null,
  ubicacion_id bigint not null references ubicaciones (id),
  categoria_id bigint not null references categorias (id),
  autor_id uuid not null references perfiles (id),
  tecnico_id uuid references perfiles (id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_revision', 'resuelto', 'cancelado')),
  prioridad text not null default 'normal'
    check (prioridad in ('baja', 'normal', 'urgente')),
  demoro_materiales boolean not null default false,
  calificacion smallint check (calificacion between 1 and 5),
  created_at timestamptz not null default now(),
  resuelto_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists historial_estados (
  id bigint generated always as identity primary key,
  reporte_id bigint not null references reportes (id) on delete cascade,
  estado_nuevo text not null
    check (estado_nuevo in ('pendiente', 'en_revision', 'resuelto', 'cancelado')),
  autor_id uuid not null references perfiles (id),
  comentario text,
  created_at timestamptz not null default now()
);

alter table reportes
  add column if not exists prioridad text not null default 'normal'
    check (prioridad in ('baja', 'normal', 'urgente'));

alter table reportes
  add column if not exists resuelto_at timestamptz;

alter table reportes
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_reportes_estado on reportes (estado);
create index if not exists idx_reportes_ubicacion on reportes (ubicacion_id);
create index if not exists idx_reportes_categoria on reportes (categoria_id);
create index if not exists idx_reportes_autor on reportes (autor_id);
create index if not exists idx_reportes_prioridad on reportes (prioridad);
create index if not exists idx_reportes_resuelto_at on reportes (resuelto_at);
create index if not exists idx_historial_reporte on historial_estados (reporte_id);

insert into ubicaciones (nombre) values
  ('Aula 1'), ('Aula 2'), ('Aula 3'), ('Baños'), ('Patio'),
  ('Pañol'), ('Server'), ('Taller')
on conflict (nombre) do nothing;

insert into categorias (nombre) values
  ('Electricidad'), ('Plomería'), ('Mobiliario'),
  ('Informática / Red'), ('Proyector'), ('Limpieza'), ('Otro')
on conflict (nombre) do nothing;

alter table perfiles enable row level security;
alter table ubicaciones enable row level security;
alter table categorias enable row level security;
alter table reportes enable row level security;
alter table historial_estados enable row level security;

create or replace function rol_actual()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select rol from perfiles where id = auth.uid();
$$;

create or replace function proteger_rol_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol and rol_actual() <> 'administrador' then
    raise exception 'Solo un administrador puede cambiar el rol de un usuario.';
  end if;
  return new;
end;
$$;

create or replace function crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Sin nombre'),
    'estudiante_docente'
  );
  return new;
end;
$$;

create or replace function mantener_fechas_reporte()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();

  if new.estado = 'resuelto' and old.estado is distinct from 'resuelto' then
    new.resuelto_at := now();
  elsif new.estado <> 'resuelto' then
    new.resuelto_at := null;
  end if;

  return new;
end;
$$;

create or replace function validar_transicion_reporte()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  es_admin boolean := rol_actual() = 'administrador';
begin
  if new.estado = old.estado then
    return new;
  end if;

  if old.estado = 'cancelado' and not es_admin then
    raise exception 'Solo un administrador puede reactivar un reporte cancelado.';
  end if;

  if old.estado = 'resuelto' and not es_admin then
    raise exception 'Solo un administrador puede reabrir un reporte resuelto.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_rol on perfiles;
create trigger trg_proteger_rol
  before update on perfiles
  for each row execute function proteger_rol_perfil();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function crear_perfil_nuevo_usuario();

drop trigger if exists trg_fechas_reporte on reportes;
create trigger trg_fechas_reporte
  before update on reportes
  for each row execute function mantener_fechas_reporte();

drop trigger if exists trg_validar_transicion on reportes;
create trigger trg_validar_transicion
  before update of estado on reportes
  for each row execute function validar_transicion_reporte();

drop policy if exists "perfiles_select_autenticados" on perfiles;
create policy "perfiles_select_autenticados"
  on perfiles for select
  to authenticated
  using (true);

drop policy if exists "perfiles_insert_propio" on perfiles;
drop policy if exists "perfiles_update_propio_o_admin" on perfiles;
create policy "perfiles_update_propio_o_admin"
  on perfiles for update
  to authenticated
  using (id = auth.uid() or rol_actual() = 'administrador')
  with check (id = auth.uid() or rol_actual() = 'administrador');

drop policy if exists "ubicaciones_select_autenticados" on ubicaciones;
create policy "ubicaciones_select_autenticados"
  on ubicaciones for select to authenticated using (true);

drop policy if exists "ubicaciones_modifica_admin" on ubicaciones;
create policy "ubicaciones_modifica_admin"
  on ubicaciones for all to authenticated
  using (rol_actual() = 'administrador')
  with check (rol_actual() = 'administrador');

drop policy if exists "categorias_select_autenticados" on categorias;
create policy "categorias_select_autenticados"
  on categorias for select to authenticated using (true);

drop policy if exists "categorias_modifica_admin" on categorias;
create policy "categorias_modifica_admin"
  on categorias for all to authenticated
  using (rol_actual() = 'administrador')
  with check (rol_actual() = 'administrador');

drop policy if exists "reportes_select_autenticados" on reportes;
drop policy if exists "reportes_select_propio_o_staff" on reportes;
create policy "reportes_select_propio_o_staff"
  on reportes for select to authenticated
  using (
    autor_id = auth.uid()
    or rol_actual() in ('tecnico', 'administrador')
  );

drop policy if exists "reportes_insert_propio" on reportes;
create policy "reportes_insert_propio"
  on reportes for insert to authenticated
  with check (
    autor_id = auth.uid()
    and estado = 'pendiente'
    and tecnico_id is null
  );

drop policy if exists "reportes_update_tecnico_admin" on reportes;
create policy "reportes_update_tecnico_admin"
  on reportes for update to authenticated
  using (rol_actual() in ('tecnico', 'administrador'));

drop policy if exists "historial_select_autenticados" on historial_estados;
drop policy if exists "historial_select_propio_o_staff" on historial_estados;
create policy "historial_select_propio_o_staff"
  on historial_estados for select to authenticated
  using (
    rol_actual() in ('tecnico', 'administrador')
    or exists (
      select 1 from reportes r
      where r.id = reporte_id and r.autor_id = auth.uid()
    )
  );

drop policy if exists "historial_insert_autor_tecnico_admin" on historial_estados;
create policy "historial_insert_autor_tecnico_admin"
  on historial_estados for insert to authenticated
  with check (
    autor_id = auth.uid()
    and (
      rol_actual() in ('tecnico', 'administrador')
      or exists (
        select 1 from reportes r
        where r.id = reporte_id and r.autor_id = auth.uid()
      )
    )
  );

update reportes r
set resuelto_at = h.ultimo
from (
  select reporte_id, max(created_at) as ultimo
  from historial_estados
  where estado_nuevo = 'resuelto'
  group by reporte_id
) h
where r.id = h.reporte_id
  and r.estado = 'resuelto'
  and r.resuelto_at is null;

-- Restricción de columnas actualizables en reportes (consigna 9)
create or replace function proteger_columnas_reporte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if rol_actual() <> 'administrador' then
    if new.titulo is distinct from old.titulo
       or new.descripcion is distinct from old.descripcion
       or new.ubicacion_id is distinct from old.ubicacion_id
       or new.categoria_id is distinct from old.categoria_id
       or new.autor_id is distinct from old.autor_id
       or new.prioridad is distinct from old.prioridad
       or new.created_at is distinct from old.created_at
       or new.resuelto_at is distinct from old.resuelto_at then
      raise exception 'No tenés permiso para modificar esos campos del reporte.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_columnas_reporte on reportes;
create trigger trg_proteger_columnas_reporte
  before update on reportes
  for each row execute function proteger_columnas_reporte();

-- Actualización atómica de estado + historial (consigna 9)
create or replace function actualizar_estado_reporte(
  p_reporte_id bigint,
  p_estado_nuevo text,
  p_comentario text default null,
  p_tecnico_id uuid default null,
  p_demoro_materiales boolean default null,
  p_calificacion smallint default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update reportes
  set estado = p_estado_nuevo,
      tecnico_id = coalesce(tecnico_id, p_tecnico_id),
      demoro_materiales = coalesce(p_demoro_materiales, demoro_materiales),
      calificacion = coalesce(p_calificacion, calificacion)
  where id = p_reporte_id;

  insert into historial_estados (reporte_id, estado_nuevo, autor_id, comentario)
  values (p_reporte_id, p_estado_nuevo, auth.uid(), p_comentario);
end;
$$;

grant execute on function actualizar_estado_reporte(bigint, text, text, uuid, boolean, smallint) to authenticated;
