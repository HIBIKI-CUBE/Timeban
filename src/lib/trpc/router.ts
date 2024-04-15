import type { Context } from '$lib/trpc/context';
import { TRPCError, initTRPC } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';

export const api = initTRPC.context<Context>().create();

export const router = api.router({
  greeting: api.procedure.query(async () => {
    return new Date();
  }),
  board: api.procedure
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
    .query(async opts => {
      const owner = (await opts.ctx.event.locals.supabase.auth.getUser()).data.user?.id;
      if (!owner) throw new TRPCError({ code: 'FORBIDDEN' });
      const board = await prisma.boards.findFirst({
        where: {
          id: opts.input,
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
      });

      return { board };
    }),
});

export const createCaller = api.createCallerFactory(router);
export type Router = typeof router;
