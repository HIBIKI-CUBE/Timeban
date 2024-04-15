import { api } from './api';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { board } from './routes/board';

export const router = api.router({
  board,
});

export type Router = typeof router;
export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
