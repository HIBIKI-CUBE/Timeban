import prisma from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { Prisma } from '@prisma/client';

export const load: PageServerLoad = async ({ params, parent }) => {
  const owner = (await parent()).session?.user.id;
  if (!owner) redirect(303, '/');
  try {
    return readBoard(Number(params.id), owner);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error(404, `Not found: ${err.message}`);
    }
  }
};

async function readBoard(id: number, owner: string) {
  return {
    board: await prisma.boards.findFirst({
      where: {
        id,
        owner,
      },
      include: {
        Lanes: {
          include: {
            Items: {
              include: {
                Logs: true,
              },
              orderBy: {
                row: 'asc',
              },
            },
          },
        },
      },
    }),
  };
}

export const actions = {
  createItem: async ({ request, locals }) => {
    const owner = (await locals.getSession())?.user.id;
    if (!owner) return;
    const data = await request.formData();
    const name = String(data.get('name'));
    const lane = Number(data.get('lane'));
    await prisma.items.create({
      data: {
        name,
        lane,
      },
    });
  },
  updateItem: async ({ request, locals }) => {
    const owner = (await locals.getSession())?.user.id;
    if (!owner) return;
    const data = await request.formData();
    const itemId = Number(data.get('id'));
    const lane = Number(data.get('lane'));
    const row = Number(data.get('row'));
    const timerControl = String(data.get('timerControl'));
    await prisma.items.update({
      where: {
        id: itemId,
      },
      data: {
        lane,
        row,
      },
    });
    if (timerControl === 'start') {
      await prisma.logs.create({
        data: {
          item: itemId,
        },
      });
    }
    if (timerControl === 'stop') {
      const target = await prisma.logs.findFirst({
        where: {
          item: itemId,
          started_at: null,
        },
        orderBy: {
          id: 'asc',
        },
      });
      if (!target?.id) return;
      await prisma.logs.update({
        where: {
          id: Number(target.id),
        },
        data: {
          stopped_at: new Date().toISOString(),
        }
      });
    }
  },
} satisfies Actions;
