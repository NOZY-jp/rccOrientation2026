import { z } from 'zod';

export const GameConfigSchema = z
  .object({
    board: z.object({
      width: z.number().int().positive().min(3),
      height: z.number().int().positive().min(3),
    }),
    mineCount: z.number().int().nonnegative(),
    seed: z.number().int(),
  })
  .refine((data) => data.mineCount < data.board.width * data.board.height, {
    message: 'mineCountはセル総数未満である必要があります',
    path: ['mineCount'],
  });

export type GameConfig = z.infer<typeof GameConfigSchema>;
