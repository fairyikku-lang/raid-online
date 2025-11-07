
-- HEROES
create table if not exists public.heroes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  faction text,
  rarity text,
  type text,
  affinity text,
  level int default 1,
  stars text default '1/6',
  asc text default '0/6',
  blessing text,
  base_hp int default 0,
  base_atk int default 0,
  base_def int default 0,
  base_spd int default 0,
  base_crate int default 0,
  base_cdmg int default 0,
  base_res int default 0,
  base_acc int default 0,
  bonus_hp int default 0,
  bonus_atk int default 0,
  bonus_def int default 0,
  bonus_spd int default 0,
  bonus_crate int default 0,
  bonus_cdmg int default 0,
  bonus_res int default 0,
  bonus_acc int default 0,
  skills jsonb default '[]'::jsonb,
  notes text,
  portrait_url text
);

-- GEAR
create table if not exists public.gear (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  hero_id uuid references public.heroes(id) on delete cascade,
  slot text check (slot in ('Broń','Tarcza','Helm','Rękawice','Zbroja','Buty','Pierścień','Amulet','Banner')),
  set_key text,
  rarity text,
  stars int default 0,
  main_type text,
  main_value int default 0
);

-- GEAR SUBSTATS
create table if not exists public.gear_substats (
  id uuid primary key default gen_random_uuid(),
  gear_id uuid references public.gear(id) on delete cascade,
  type text,
  value int default 0
);

-- SETS
create table if not exists public.sets (
  key text primary key,
  name text not null,
  pieces int not null,
  description text,
  icon_url text
);

-- RLS
alter table public.heroes enable row level security;
alter table public.gear enable row level security;
alter table public.gear_substats enable row level security;
alter table public.sets enable row level security;

-- Simple policy: authenticated users can read/write everything (you can tighten later)
create policy "ro all auth" on public.heroes for select using (auth.role() = 'authenticated');
create policy "rw all auth" on public.heroes for all using (auth.role() = 'authenticated');

create policy "ro all auth g" on public.gear for select using (auth.role() = 'authenticated');
create policy "rw all auth g" on public.gear for all using (auth.role() = 'authenticated');

create policy "ro all auth gs" on public.gear_substats for select using (auth.role() = 'authenticated');
create policy "rw all auth gs" on public.gear_substats for all using (auth.role() = 'authenticated');

create policy "ro all auth sets" on public.sets for select using (true);
create policy "rw admin sets" on public.sets for all using (auth.role() = 'authenticated'); -- adjust later

-- Seed sets minimal
insert into public.sets(key,name,pieces,description,icon_url) values
  ('LIFESTEAL','Lifesteal',4,'Leeching attacks', null),
  ('SPEED','Speed',2,'+12% SPD', null),
  ('CHRONOPHAGE','Chronophage',2,'+10% SPD +20 RES (2p)', null),
  ('DIVINE_LIFE','Divine Life',2,'+15% HP + Shield 3 tury (2p)', null),
  ('IMMORTAL','Immortal',2,'+15% HP + 3% heal/turn (2p)', null)
on conflict (key) do nothing;
