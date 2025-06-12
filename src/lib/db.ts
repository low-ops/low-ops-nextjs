import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

function client() {
  // const password = encodeURIComponent(process.env.DatabasePassword || '');

  // const datasourceUrl = [
  //   'postgresql://',
  //   process.env.DatabaseUserName,
  //   ':',
  //   password,
  //   '@',
  //   process.env.DatabaseHost,
  //   '/',
  //   process.env.DatabaseName,
  // ].join('');

  // return new PrismaClient({ datasources: { db: { url: datasourceUrl } } }).$extends(withAccelerate());

  return new PrismaClient().$extends(withAccelerate());
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || (process.env.NEXT_PHASE === 'phase-production-build' ? null : client());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// postgres://next-db-env5-role:B%40#3pYpk5Ykffy9zPzbAxeB3U@apps-postgresql-cluster-rw.lowops-data.svc.cluster.local/next-db-env5-db
