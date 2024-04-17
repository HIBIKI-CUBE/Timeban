import { api } from '../api';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';
import { getOwnerOrForbidden } from '../getOwnerOrForbidden';

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
  create: api.procedure
    .input(
      z.string({
        required_error: 'Board name is missing',
        invalid_type_error: 'Board name must be a string',
        description: 'Board name',
      }),
    )
    .mutation(async ({ ctx: { event }, input }) => {
      const owner = await getOwnerOrForbidden(event);
      const board = await prisma.boards.create({
        data: {
          name: input,
          owner,
        },
      });

      return { board };
    }),
  read: api.procedure
    .input(
      z
        .number({
          required_error: 'Board id is missing',
          invalid_type_error: 'Board id must be a number',
          description: 'Board id',
        })
        .int()
        .positive()
        .safe(),
    )
    .query(async ({ ctx: { event }, input }) => {
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
    .input(
      z.object({
        boardId: z
          .number({
            required_error: 'Board id is missing',
            invalid_type_error: 'Board id must be a number',
            description: 'Board id',
          })
          .int()
          .positive()
          .safe(),
        paused: z.boolean(),
      }),
    )
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
