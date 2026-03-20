import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export interface WorkspaceOpenAIClient {
  client: OpenAI;
  workspaceId: string;
}

export async function getWorkspaceOpenAIClient(): Promise<WorkspaceOpenAIClient> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('No workspace found');

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('settings')
    .eq('id', profile.workspace_id)
    .single();

  const apiKey = workspace?.settings?.openai_api_key;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add your API key in Settings → API Keys.');
  }

  return {
    client: new OpenAI({ apiKey }),
    workspaceId: profile.workspace_id,
  };
}
