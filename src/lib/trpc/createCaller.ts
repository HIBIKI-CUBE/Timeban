import { router } from './router';
import { api } from './api';

export const createCaller = api.createCallerFactory(router);
