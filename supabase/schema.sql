create extension if not exists vector;

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  companion_name text not null,
  age integer not null,
  language text not null default 'Kannada',
  mode text not null default 'elder' check (mode in ('elder', 'child')),
  condition_notes text default '',
  favourite_topics jsonb default '[]',
  family_members jsonb default '[]',
  triggers jsonb default '[]',
  comfort_patterns jsonb default '[]',
  schedule jsonb default '{"morning": true, "evening": true}',
  last_conversation_at timestamptz,
  created_at timestamptz default now()
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  embedding vector(1536),
  source_type text not null,
  source_file_url text,
  created_at timestamptz default now()
);

create index on memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table conversation_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  turn_index integer default 0,
  transcript text not null,
  response text not null,
  emotion_label text not null default 'calm',
  emotion_confidence float default 0.5,
  safety_flag boolean default false,
  rag_chunks_used jsonb default '[]',
  mem0_memories_used jsonb default '[]',
  created_at timestamptz default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  severity text not null check (severity in ('emergency', 'moderate', 'info')),
  transcript_excerpt text not null,
  emotion_label text not null,
  resolved boolean default false,
  created_at timestamptz default now()
);

create table caregiver_phones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  phone text not null,
  created_at timestamptz default now()
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  device_token text not null,
  last_ping timestamptz,
  firmware_version text,
  created_at timestamptz default now()
);

create or replace function match_memories(
  query_embedding vector(1536),
  match_profile_id uuid,
  match_count int default 3
)
returns table (id uuid, content text, similarity float)
language sql stable
as $$
  select id, content, 1 - (embedding <=> query_embedding) as similarity
  from memories
  where profile_id = match_profile_id
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

alter table profiles enable row level security;
alter table memories enable row level security;
alter table conversation_logs enable row level security;
alter table alerts enable row level security;
alter table caregiver_phones enable row level security;
alter table devices enable row level security;

create policy "users see own profiles" on profiles for all using (auth.uid() = user_id);
create policy "users see own memories" on memories for all using (
  profile_id in (select id from profiles where user_id = auth.uid())
);
create policy "users see own logs" on conversation_logs for all using (
  profile_id in (select id from profiles where user_id = auth.uid())
);
create policy "users see own alerts" on alerts for all using (
  profile_id in (select id from profiles where user_id = auth.uid())
);
create policy "users manage own phones" on caregiver_phones for all using (auth.uid() = user_id);
create policy "users see own devices" on devices for all using (
  profile_id in (select id from profiles where user_id = auth.uid())
);

insert into storage.buckets (id, name, public) values ('memories', 'memories', true)
on conflict (id) do nothing;

create policy "users upload own memories" on storage.objects for insert with check (
  bucket_id = 'memories' and (storage.foldername(name))[1] in (
    select id::text from profiles where user_id = auth.uid()
  )
);

create policy "users read own memories" on storage.objects for select using (
  bucket_id = 'memories' and (storage.foldername(name))[1] in (
    select id::text from profiles where user_id = auth.uid()
  )
);

create policy "users delete own memories" on storage.objects for delete using (
  bucket_id = 'memories' and (storage.foldername(name))[1] in (
    select id::text from profiles where user_id = auth.uid()
  )
);
