import { SupabaseClient } from '@supabase/supabase-js';

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: string;
  displayName: string | null;
}

export async function getWorkspaceContext(supabase: SupabaseClient): Promise<WorkspaceContext> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workspace_id, role, display_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) throw new Error('No workspace found');

  return {
    userId: user.id,
    workspaceId: profile.workspace_id,
    role: profile.role,
    displayName: profile.display_name,
  };
}
