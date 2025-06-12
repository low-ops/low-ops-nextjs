import { init } from '@paralleldrive/cuid2';

const createId = init({
  random: Math.random,
  length: 10,
  fingerprint: process.env.S3_SECRET_ACCESS_KEY ?? 'secret',
});

export const randomId = () => {
  return createId();
};
