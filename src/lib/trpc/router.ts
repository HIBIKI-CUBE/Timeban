import type { Context } from '$lib/trpc/context';
import { TRPCError, initTRPC } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const api = initTRPC.context<Context>().create();

export const router = api.router({
  createBoard: api.procedure
    .input(
      z.string({
        required_error: 'Board name is missing',
        invalid_type_error: 'Board name must be a string',
        description: 'Board name',
      }),
    )
    .mutation(async opts => {
      const owner = (await opts.ctx.event.locals.supabase.auth.getUser()).data.user?.id;
      if (!owner) throw new TRPCError({ code: 'FORBIDDEN' });
      const board = await prisma.boards.create({
        data: {
          name: opts.input,
          owner,
        },
      });

      return { board };
    }),
  getBoard: api.procedure
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
      const board = await prisma.boards
        .findFirstOrThrow({
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
        })
        .catch(() => {
          throw new TRPCError({ code: 'NOT_FOUND' });
        });

      return { board };
    }),
});

export const createCaller = api.createCallerFactory(router);
export type Router = typeof router;
export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
