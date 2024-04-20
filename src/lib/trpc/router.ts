import { api } from './api';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { board } from './routes/board';
import { lane } from './routes/lane';
import { item } from './routes/item';

export const router = api.router({
  board,
  lane,
  item,
});

export type Router = typeof router;
export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
