import { api } from '../api';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';
import { getOwnerOrForbidden } from '../getOwnerOrForbidden';
import { laneSchema } from '$lib/schemas/lane';
import { boardSchema } from '$lib/schemas/board';

export const laneInput = {
  create: z.object({
    name: laneSchema.name,
    boardId: boardSchema.id,
    runsTimer: z.boolean().optional().default(false),
  }),
};

export const lane = api.router({
  create: api.procedure
    .input(laneInput.create)
    .mutation(async ({ ctx: { event }, input: { name, boardId, runsTimer } }) => {
      const owner = await getOwnerOrForbidden(event);
      const board = await prisma.boards
        .findUniqueOrThrow({
          where: {
            id: boardId,
            owner,
          },
        })
        .catch(() => {
          throw new TRPCError({ code: 'FORBIDDEN' });
        });
      await prisma.lanes.create({
        data: {
          name,
          board: board.id,
          runsTimer,
        },
      });
    }),
});
