create table if not exists pk26_results (key text primary key, a int not null, b int not null, w text, updated_at timestamptz not null default now());
create table if not exists pk26_settings (id int primary key default 1 check (id = 1), adj jsonb not null default '{}'::jsonb);
insert into pk26_settings (id, adj) values (1, '{}'::jsonb) on conflict (id) do nothing;
create table if not exists pk26_visits (d date primary key, n bigint not null default 0);
alter table pk26_results enable row level security;
alter table pk26_settings enable row level security;
alter table pk26_visits enable row level security;
drop policy if exists "pk26 results read" on pk26_results;
drop policy if exists "pk26 settings read" on pk26_settings;
create policy "pk26 results read" on pk26_results for select using (true);
create policy "pk26 settings read" on pk26_settings for select using (true);
create or replace function pk26_ok(p_id text, p_pw text) returns boolean language sql immutable as $$ select md5(p_id || '|' || p_pw) = '530074df52e6cbbd4f450691859cd933' $$;
create or replace function pk26_login(p_id text, p_pw text) returns boolean language sql security definer set search_path = public as $$ select pk26_ok(p_id, p_pw) $$;
create or replace function pk26_save_result(p_id text, p_pw text, p_key text, p_a int, p_b int, p_w text) returns void language plpgsql security definer set search_path = public as $$ begin if not pk26_ok(p_id, p_pw) then raise exception 'not allowed'; end if; insert into pk26_results (key, a, b, w, updated_at) values (p_key, p_a, p_b, p_w, now()) on conflict (key) do update set a = excluded.a, b = excluded.b, w = excluded.w, updated_at = now(); end $$;
create or replace function pk26_delete_result(p_id text, p_pw text, p_key text) returns void language plpgsql security definer set search_path = public as $$ begin if not pk26_ok(p_id, p_pw) then raise exception 'not allowed'; end if; delete from pk26_results where key = p_key; end $$;
create or replace function pk26_save_adj(p_id text, p_pw text, p_adj jsonb) returns void language plpgsql security definer set search_path = public as $$ begin if not pk26_ok(p_id, p_pw) then raise exception 'not allowed'; end if; update pk26_settings set adj = p_adj where id = 1; end $$;
create or replace function pk26_hit(p_inc boolean default true) returns json language plpgsql security definer set search_path = public as $$
declare t date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if p_inc then insert into pk26_visits (d, n) values (t, 1) on conflict (d) do update set n = pk26_visits.n + 1; end if;
  return json_build_object('total', (select coalesce(sum(n), 0) from pk26_visits), 'today', coalesce((select n from pk26_visits where d = t), 0));
end $$;
grant execute on function pk26_login(text, text), pk26_save_result(text, text, text, int, int, text), pk26_delete_result(text, text, text), pk26_save_adj(text, text, jsonb), pk26_hit(boolean) to anon, authenticated;
alter publication supabase_realtime add table pk26_results, pk26_settings;
