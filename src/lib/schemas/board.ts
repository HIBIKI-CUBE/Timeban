import { z } from 'zod';

export const boardSchema = {
  id: z
    .number({
      required_error: 'Board id is missing',
      invalid_type_error: 'Board id must be a number',
      description: 'Board id',
    })
    .int()
    .positive()
    .safe(),
  name: z.string({
    required_error: 'Board name is missing',
    invalid_type_error: 'Board name must be a string',
    description: 'Board name',
  }),
};
