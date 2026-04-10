import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUsage, type PlanName } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organizations(plan)')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'no org' }, { status: 400 });
  }

  const org = profile.organizations as unknown as { plan: string } | null;
  const plan = (org?.plan ?? 'starter') as PlanName;
  const usage = await getUsage(supabase, profile.organization_id, plan);

  // Count new notifs since last_seen_at (passed as query param)
  const since = request.nextUrl.searchParams.get('since');
  let newNotifs = 0;
  if (since) {
    const { count } = await supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', since);
    newNotifs = count ?? 0;
  }

  return NextResponse.json({ ...usage, newNotifs });
}
