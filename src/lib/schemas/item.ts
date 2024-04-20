import { z } from 'zod';

export const itemSchema = {
  id: z
    .number({
      required_error: 'Item id is missing',
      invalid_type_error: 'Item id must be a number',
      description: 'Item id',
    })
    .int()
    .positive()
    .safe(),
  name: z.string({
    required_error: 'Item name is missing',
    invalid_type_error: 'Item name must be a string',
    description: 'Item name',
  }),
  row: z
    .number({
      required_error: 'Row number is missing',
      invalid_type_error: 'Row number must be a number',
      description: 'Row number',
    })
    .int()
    .nonnegative()
    .safe(),
};
