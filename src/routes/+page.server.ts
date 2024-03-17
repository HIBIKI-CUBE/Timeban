import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { Prisma } from '@prisma/client';

export const load: PageServerLoad = async ({ params, parent }) => {
  const owner = (await parent()).session?.user.id;
  if (!owner) return;
  try {
    return {
      boards: await prisma.boards.findMany({
        where: {
          owner: (await parent()).session?.user.id,
        },
      }),
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error(404, `Not found: ${err.message}`);
    }
  }
};
