require('dotenv').config();
const { supabase } = require('./src/services/supabaseClient');

async function setupGroups() {
  try {
    console.log('Setting up groups tables...');

    // Try to query groups table directly
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .limit(1);
      
    if (error) {
      if (error.message.includes('relation "public.groups" does not exist')) {
        console.log('❌ Groups table not found. Please run the following SQL in your Supabase SQL Editor:');
        console.log('\n--- COPY AND PASTE THIS SQL INTO SUPABASE SQL EDITOR ---\n');
        
        const sql = `
-- Create groups table
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  icon_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Create group members table
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Add group_id to photos table
alter table public.photos add column if not exists group_id uuid references public.groups(id) on delete set null;

-- Create indexes
create index on public.groups (created_by);
create index on public.group_members (group_id);
create index on public.group_members (user_id);
create index on public.photos (group_id);

-- Enable RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Group policies
create policy "Users can view groups they belong to" on public.groups
  for select using (
    id in (
      select group_id from public.group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can create groups" on public.groups
  for insert with check (auth.uid() = created_by);

create policy "Group admins can update groups" on public.groups
  for update using (
    id in (
      select group_id from public.group_members 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Group member policies
create policy "Users can view group members of their groups" on public.group_members
  for select using (
    group_id in (
      select group_id from public.group_members 
      where user_id = auth.uid()
    )
  );

create policy "Group admins can manage members" on public.group_members
  for all using (
    group_id in (
      select group_id from public.group_members 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Grant permissions
grant all on public.groups to authenticated;
grant all on public.group_members to authenticated;
`;
        
        console.log(sql);
        console.log('\n--- END OF SQL ---\n');
        console.log('After running the SQL, restart your backend server and try again.');
        return;
      } else {
        console.error('Error accessing groups:', error);
        return;
      }
    }
    
    console.log('✓ Groups table exists and is accessible');
    console.log(`Found ${groups.length} groups in database`);
    
    // Check group_members table
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('*')
      .limit(1);
      
    if (membersError) {
      console.error('Error accessing group_members:', membersError);
    } else {
      console.log('✓ Group members table exists and is accessible');
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupGroups();