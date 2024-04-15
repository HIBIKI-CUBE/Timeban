import prisma from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { Prisma } from '@prisma/client';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';

export const load: PageServerLoad = async ({ params, locals: { supabase }, depends }) => {
  depends('supabase:auth');

  const owner = (await supabase.auth.getUser()).data.user?.id;
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
                Logs: {
                  orderBy: {
                    created_at: 'asc',
                  },
                },
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
  createItem: async ({ request, locals: { supabase } }) => {
    const ownerId = (await supabase.auth.getUser()).data.user?.id;
    const data = await request.formData();
    const name = String(data.get('name'));
    const laneId = Number(data.get('lane'));
    const runsTimer = Boolean(data.get('runsTimer'));
    const lane = await prisma.lanes
      .findUniqueOrThrow({
        where: {
          id: laneId,
          Boards: {
            owner: ownerId,
          },
        },
      })
      .catch(() => {
        return error(403, 'Forbidden');
      });
    await prisma.items.create({
      data: {
        name,
        lane: lane.id,
        Logs: {
          create: runsTimer ? [{}] : [],
        },
      },
    });
  },
  createLane: async ({ request, locals: { supabase } }) => {
    const ownerId = (await supabase.auth.getUser()).data.user?.id;
    const data = await request.formData();
    const name = String(data.get('name'));
    const boardId = Number(data.get('board'));
    const runsTimer = Boolean(data.get('runsTimer'));
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
    await prisma.lanes.create({
      data: {
        name,
        board: board.id,
        runsTimer,
      },
    });
  },
  updateItem: async ({ request, locals: { supabase } }) => {
    const ownerId = (await supabase.auth.getUser()).data.user?.id;
    const data = await request.formData();
    const itemId = Number(data.get('id'));
    const laneId = Number(data.get('lane'));
    const row = Number(data.get('row'));
    const timerControl = String(data.get('timerControl'));
    const item = await prisma.items
      .findUniqueOrThrow({
        where: {
          id: itemId,
          Lanes: {
            Boards: {
              owner: ownerId,
            },
          },
        },
        include: {
          Lanes: true,
        },
      })
      .catch(() => {
        return error(403, 'Forbidden');
      });
    if ((laneId || laneId === 0) && (row || row === 0)) {
      const lane = await prisma.lanes
        .findUniqueOrThrow({
          where: {
            id: laneId,
            Boards: {
              owner: ownerId,
            },
          },
        })
        .catch(() => {
          return error(403, 'Forbidden');
        });
      await prisma.items.update({
        where: {
          id: item.id,
        },
        data: {
          lane: lane.id,
          row,
        },
      });
    }
    if (timerControl === 'start') {
      await prisma.logs.create({
        data: {
          item: item.id,
        },
      });
    }
    if (timerControl === 'stop') {
      const target = await prisma.logs.findFirst({
        where: {
          item: item.id,
        },
        orderBy: {
          id: 'desc',
        },
      });
      if (!target?.id || target.stopped_at !== null) return;
      await prisma.logs.update({
        where: {
          id: Number(target.id),
        },
        data: {
          stopped_at: new Date(),
        },
      });
    }
  },
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
