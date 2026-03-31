import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export interface BusinessOpenAIClient {
  client: OpenAI;
  businessId: string;
}

export async function getBusinessOpenAIClient(): Promise<BusinessOpenAIClient> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_business_id')
    .eq('id', user.id)
    .single();

  if (!profile?.active_business_id) throw new Error('No business found');

  const { data: business } = await supabase
    .from('businesses')
    .select('settings')
    .eq('id', profile.active_business_id)
    .single();

  const apiKey = business?.settings?.openai_api_key;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add your API key in Settings → API Keys.');
  }

  return {
    client: new OpenAI({ apiKey }),
    businessId: profile.active_business_id,
  };
}
