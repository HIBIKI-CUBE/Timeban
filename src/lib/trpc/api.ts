import type { Context } from '$lib/trpc/context';
import { initTRPC } from '@trpc/server';

export const api = initTRPC.context<Context>().create();
