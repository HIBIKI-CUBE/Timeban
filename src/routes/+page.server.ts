import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  try {
    return {
      boards: await prisma.boards.findMany(),
    };
  } catch (err) {
    error(404, `Not found: ${err.message}`);
  }
};
