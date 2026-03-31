import { SupabaseClient } from '@supabase/supabase-js';

export interface BusinessContext {
  userId: string;
  businessId: string;
  role: string;
  displayName: string | null;
}

/** @deprecated Use getBusinessContext instead */
export type WorkspaceContext = BusinessContext;

export async function getBusinessContext(supabase: SupabaseClient): Promise<BusinessContext> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active_business_id, role, display_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.active_business_id) throw new Error('No business found');

  return {
    userId: user.id,
    businessId: profile.active_business_id,
    role: profile.role,
    displayName: profile.display_name,
  };
}

/** @deprecated Use getBusinessContext instead */
export const getWorkspaceContext = getBusinessContext;
