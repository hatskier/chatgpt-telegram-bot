import { config } from 'dotenv';
import { z } from 'zod';

config({ path: '.env.prod' });

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(5),
  OPENAI_SECRET_KEY: z.string().min(5),
  OPENAI_ORG_ID: z.string().min(5),
});

export const env = envSchema.parse(process.env);

export const isDev = process.env.NODE_ENV === 'development';

export const isProd = !isDev;

export default env;
