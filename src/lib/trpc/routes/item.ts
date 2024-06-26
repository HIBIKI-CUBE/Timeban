import { api } from '../api';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import prisma from '$lib/server/prisma';
import { getOwnerOrForbidden } from '../getOwnerOrForbidden';
import { itemSchema } from '$lib/schemas/item';
import { laneSchema } from '$lib/schemas/lane';

export const itemInput = {
  create: z.object({
    name: itemSchema.name,
    laneId: laneSchema.id,
    runsTimer: z.boolean().optional().default(false),
  }),
  update: z.object({
    itemId: itemSchema.id,
    laneId: laneSchema.id.optional(),
    row: itemSchema.row.optional(),
    runsTimer: z.boolean().optional(),
  }),
};

export const item = api.router({
  create: api.procedure
    .input(itemInput.create)
    .mutation(async ({ ctx: { event }, input: { name, laneId, runsTimer } }) => {
      const owner = await getOwnerOrForbidden(event);
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
      await prisma.items.create({
        data: {
          name,
          lane: lane.id,
          Logs: {
            create: runsTimer ? [{}] : [],
          },
        },
      });
    }),
  update: api.procedure
    .input(itemInput.update)
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
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Item not found' });
        });
      if (laneId && row !== undefined) {
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
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Lane not found',
            });
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
        if (!target) return;
        if (target.stopped_at === null) {
          await prisma.logs.update({
            where: {
              id: target.id,
            },
            data: {
              stopped_at: new Date(),
            },
          });
        }
      }
    }),
});
