import { api } from '../api';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';

export const board = api.router({
  list: api.procedure.query(
    async ({
      ctx: {
        event: {
          locals: { supabase },
        },
      },
    }) => {
      const owner = (await supabase.auth.getUser()).data.user?.id;
      if (!owner) throw new TRPCError({ code: 'FORBIDDEN' });
      const boards = await prisma.boards.findMany({
        where: {
          owner,
        },
      });
      return { boards };
    },
  ),
  create: api.procedure
    .input(
      z.string({
        required_error: 'Board name is missing',
        invalid_type_error: 'Board name must be a string',
        description: 'Board name',
      }),
    )
    .mutation(
      async ({
        ctx: {
          event: {
            locals: { supabase },
          },
        },
        input,
      }) => {
        const owner = (await supabase.auth.getUser()).data.user?.id;
        if (!owner) throw new TRPCError({ code: 'FORBIDDEN' });
        const board = await prisma.boards.create({
          data: {
            name: input,
            owner,
          },
        });

        return { board };
      },
    ),
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
    .query(
      async ({
        ctx: {
          event: {
            locals: { supabase },
          },
        },
        input,
      }) => {
        const owner = (await supabase.auth.getUser()).data.user?.id;
        if (!owner) throw new TRPCError({ code: 'FORBIDDEN' });
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
      },
    ),
});
