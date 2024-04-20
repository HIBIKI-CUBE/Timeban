import { z } from 'zod';

export const laneSchema = {
  id: z
    .number({
      required_error: 'Lane id is missing',
      invalid_type_error: 'Lane id must be a number',
      description: 'Lane id',
    })
    .int()
    .positive()
    .safe(),
  name: z.string({
    required_error: 'Lane name is missing',
    invalid_type_error: 'Lane name must be a string',
    description: 'Lane name',
  }),
};
