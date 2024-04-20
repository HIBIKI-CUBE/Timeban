import type { RequestEvent } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';
export const getOwnerOrForbidden = async (event: RequestEvent) => {
  const owner = (await event.locals.supabase.auth.getUser()).data.user?.id;
  if (!owner) throw new TRPCError({ code: 'FORBIDDEN' });
  return owner;
};
