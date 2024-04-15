import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { HTTPException } from 'hono/http-exception';
import prisma from '$lib/server/prisma';

type Variables = {
  owner: string;
};
export const api = new Hono<{ Variables: Variables }>();
export const endpoint = '/api';

const apiRoute = api.get('/readBoard/:id', async c => {
  const owner = c.get('owner');
  if (!owner) {
    throw new HTTPException(403);
  }
  const board = await (async () => {
    try {
      return await prisma.boards.findFirst({
        where: {
          id: Number(c.req.param('id')),
          owner: owner || '',
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
    } catch (err) {
      if (err instanceof Error) throw new HTTPException(404, { message: err.message });
    }
  })();
  if (!board) {
    throw new HTTPException(403);
  }
  return c.json({ board }, 200);
});

export type APIRoute = typeof apiRoute;
