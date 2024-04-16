import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/createCaller';

export const load: PageServerLoad = async event => {
  const {
    params: { id },
    depends,
  } = event;
  depends('supabase:auth');

  return await createCaller(await createContext(event))
    .board.read(Number(id))
    .catch((err: unknown) => {
      error(404, `Not found: ${err instanceof Error ? err.message : ''}`);
    });
};

export const actions = {
  updatePause: async ({ request, locals: { supabase } }) => {
    const ownerId = (await supabase.auth.getUser()).data.user?.id;
    const data = await request.formData();
    const boardId = Number(data.get('id'));
    const pausedStr = String(data.get('paused'));
    const paused = (() => {
      switch (pausedStr) {
        case 'paused':
          return true;
        case 'resumed':
          return false;
        default:
          return false;
      }
    })();
    const board = await prisma.boards
      .findUniqueOrThrow({
        where: {
          id: boardId,
          owner: ownerId,
        },
      })
      .catch(() => {
        return error(403, 'Forbidden');
      });
    await prisma.boards.update({
      where: {
        id: board.id,
      },
      data: {
        paused,
      },
    });
  },
} satisfies Actions;
