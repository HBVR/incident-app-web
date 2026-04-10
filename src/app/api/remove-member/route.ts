import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Vérifier que l'appelant est connecté et admin/manager
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!callerProfile || !['admin', 'manager'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'only admins/managers can remove members' }, { status: 403 });
  }

  const { memberId } = await request.json();
  if (!memberId) {
    return NextResponse.json({ error: 'memberId required' }, { status: 400 });
  }

  // Empêcher de se supprimer soi-même
  if (memberId === user.id) {
    return NextResponse.json({ error: 'cannot remove yourself' }, { status: 400 });
  }

  // Vérifier que le membre est dans la même orga
  const { data: memberProfile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', memberId)
    .single();

  if (!memberProfile || memberProfile.organization_id !== callerProfile.organization_id) {
    return NextResponse.json({ error: 'member not in your organization' }, { status: 404 });
  }

  // Utiliser le service role pour supprimer
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Détacher les incidents du membre
  await admin.from('incidents').update({ reporter_id: user.id }).eq('reporter_id', memberId);
  await admin.from('incidents').update({ assignee_id: null }).eq('assignee_id', memberId);
  await admin.from('sites').update({ created_by: null }).eq('created_by', memberId);

  // Supprimer le profil puis le user auth
  await admin.from('profiles').delete().eq('id', memberId);
  const { error } = await admin.auth.admin.deleteUser(memberId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
