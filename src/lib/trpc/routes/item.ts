import { api } from '../api';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';
import { getOwnerOrForbidden } from '../getOwnerOrForbidden';

export const item = api.router({
  update: api.procedure
    .input(
      z.object({
        itemId: z
          .number({
            required_error: 'Item id is missing',
            invalid_type_error: 'Item id must be a number',
            description: 'Item id',
          })
          .int()
          .positive()
          .safe(),
        laneId: z
          .number({
            required_error: 'Lane id is missing',
            invalid_type_error: 'Lane id must be a number',
            description: 'Lane id',
          })
          .int()
          .positive()
          .safe(),
        row: z
          .number({
            required_error: 'Row number is missing',
            invalid_type_error: 'Row number must be a number',
            description: 'Row number',
          })
          .int()
          .nonnegative()
          .safe(),
        runsTimer: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx: { event }, input: { itemId, laneId, row, runsTimer } }) => {
      const owner = await getOwnerOrForbidden(event);
      const item = await prisma.items
        .findUniqueOrThrow({
          where: {
            id: itemId,
            Lanes: {
              Boards: {
                owner,
              },
            },
          },
          include: {
            Lanes: true,
          },
        })
        .catch(() => {
          throw new TRPCError({ code: 'FORBIDDEN' });
        });
      if (laneId && (row || row === 0)) {
        const lane = await prisma.lanes
          .findUniqueOrThrow({
            where: {
              id: laneId,
              Boards: {
                owner,
              },
            },
          })
          .catch(() => {
            throw new TRPCError({ code: 'FORBIDDEN' });
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
      if (runsTimer === true) {
        await prisma.logs.create({
          data: {
            item: item.id,
          },
        });
      }
      if (runsTimer === false) {
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
            id: target.id,
          },
          data: {
            stopped_at: new Date(),
          },
        });
      }
    }),
});
