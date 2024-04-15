import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/createCaller';

export const load: PageServerLoad = async ({ params, parent, depends, locals: { supabase } }) => {
  depends('supabase:auth');

  const owner = (await supabase.auth.getUser()).data.user?.id;
  if (!owner) return;
  try {
    return {
      boards: await prisma.boards.findMany({
        where: {
          owner,
        },
      }),
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error(404, `Not found: ${err.message}`);
    }
  }
};
