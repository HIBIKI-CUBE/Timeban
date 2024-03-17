import prisma from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { Prisma } from '@prisma/client';

export const load: PageServerLoad = async ({ params, parent }) => {
  const owner = (await parent()).session?.user.id;
  if (!owner) redirect(303, '/');
  try {
    return readBoard(Number(params.id), owner);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error(404, `Not found: ${err.message}`);
    }
  }
};

async function readBoard(id: number, owner: string) {
  return {
    board: await prisma.boards.findFirst({
      where: {
        id,
        owner,
      },
      include: {
        Lanes: {
          include: {
            Items: {
              include: {
                Logs: true,
              },
            },
          },
        },
      },
    }),
  };
}

export const actions = {
  createItem: async ({ request }) => {
    const data = await request.formData();
    const name = String(data.get('name'));
    const lane = Number(data.get('lane'));
    await prisma.items.create({
      data: {
        name,
        lane,
      },
    });
  },
  updateItem: async ({ request, params }) => {
    const data = await request.formData();
    const id = Number(data.get('id'));
    const lane = Number(data.get('lane'));
    await prisma.items.update({
      where: {
        id,
      },
      data: {
        lane,
      },
    });
  },
} satisfies Actions;
