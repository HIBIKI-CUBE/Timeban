import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  try {
    return readBoard(Number(params.id));
  } catch (err) {
    error(404, `Not found: ${err.message}`);
  }
};

async function readBoard(id: number) {
  return {
    board: await prisma.boards.findFirst({
      where: {
        id,
      },
      include: {
        Lanes: {
          include: {
            Items: {
              include: {
                Durations: true,
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
    const lane_id = Number(data.get('lane_id'));
    await prisma.items.create({
      data: {
        name,
        lane_id,
      },
    });
  },
  updateItem: async ({ request, params }) => {
    const data = await request.formData();
    const id = Number(data.get('id'));
    const lane_id = Number(data.get('lane_id'));
    await prisma.items.update({
      where: {
        id,
      },
      data: {
        lane_id,
      },
    });;
  },
} satisfies Actions;
