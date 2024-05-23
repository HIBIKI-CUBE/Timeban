import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/createCaller';

export const load: PageServerLoad = async event => {
  const { depends } = event;
  depends('supabase:auth');

  return await createCaller(await createContext(event))
    .board.list()
    .catch((err: unknown) => {
      error(404, `Not found: ${err instanceof Error ? err.message : ''}`);
    });
};
