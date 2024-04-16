import { api } from '../api';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';
import { getOwnerOrForbidden } from '../getOwnerOrForbidden';

export const lane = api.router({
  create: api.procedure
    .input(
      z.object({
        name: z.string({
          required_error: 'Lane name is missing',
          invalid_type_error: 'Lane name must be a string',
          description: 'Lane name',
        }),
        boardId: z
          .number({
            required_error: 'Board id is missing',
            invalid_type_error: 'Board id must be a number',
            description: 'Board id',
          })
          .int()
          .positive()
          .safe(),
        runsTimer: z.boolean().optional().default(false),
      }),
    )
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
