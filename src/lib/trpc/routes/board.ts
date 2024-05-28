import { api } from '../api';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';
import { getOwnerOrForbidden } from '../getOwnerOrForbidden';
import { boardSchema } from '$lib/schemas/board';

export const boardInput = {
  create: boardSchema.name,
  read: boardSchema.id,
  masterTimer: z.object({
    boardId: boardSchema.id,
    paused: z.boolean(),
  }),
};

export const board = api.router({
  list: api.procedure.query(async ({ ctx: { event } }) => {
    const owner = await getOwnerOrForbidden(event);
    const boards = await prisma.boards.findMany({
      where: {
        owner,
      },
    });
    return { boards };
  }),
  create: api.procedure.input(boardInput.create).mutation(async ({ ctx: { event }, input }) => {
    const owner = await getOwnerOrForbidden(event);
    const board = await prisma.boards.create({
      data: {
        name: input,
        owner,
      },
    });

    return { board };
  }),
  read: api.procedure.input(boardInput.read).query(async ({ ctx: { event }, input }) => {
    const owner = await getOwnerOrForbidden(event);
    const board = await prisma.boards
      .findFirstOrThrow({
        where: {
          id: input,
          owner,
        },
        include: {
          Lanes: {
            include: {
              Items: {
                where: {
                  deleted: false,
                },
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
      })
      .catch(() => {
        throw new TRPCError({ code: 'NOT_FOUND' });
      });

    return { board };
  }),
  masterTimer: api.procedure
    .input(boardInput.masterTimer)
    .mutation(async ({ ctx: { event }, input }) => {
      const owner = await getOwnerOrForbidden(event);
      await prisma.boards
        .update({
          where: {
            id: input.boardId,
            owner,
          },
          data: {
            paused: input.paused,
          },
        })
        .catch(() => {
          throw new TRPCError({ code: 'NOT_FOUND' });
        });
    }),
});
