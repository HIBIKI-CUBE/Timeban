import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/createCaller';

export const load: PageServerLoad = async event => {
  const {
    params: { id },
    depends,
  } = event;
  depends('supabase:auth');

  if (!(await event.locals.safeGetSession()).user?.id) return;

  return await createCaller(await createContext(event))
    .board.read(Number(id))
    .catch((err: unknown) => {
      error(404, `Not found: ${err instanceof Error ? err.message : ''}`);
    });
};
