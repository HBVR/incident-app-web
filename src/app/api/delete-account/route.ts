import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Détacher les données liées
  await admin.from('incidents').delete().eq('reporter_id', user.id);
  await admin.from('incidents').update({ assignee_id: null }).eq('assignee_id', user.id);
  await admin.from('sites').update({ created_by: null }).eq('created_by', user.id);

  // Supprimer le profil puis le user auth
  await admin.from('profiles').delete().eq('id', user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
