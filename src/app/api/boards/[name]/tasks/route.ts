import { createTask } from '@/modules/tasks.db';
import { NextRequest } from 'next/server';

type TParams = {
  params: Promise<{ name: string }>;
};

export async function POST(request: NextRequest, { params }: TParams) {
  try {
    const { name } = await params;
    const title = await request.json();
    const task = await createTask(title, name);
    return Response.json(task, { status: 201, statusText: 'Created' });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
