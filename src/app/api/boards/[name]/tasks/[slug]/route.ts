import { deleteTask, getTaskByStatus, updateTask } from '@/modules/tasks.db';
import { Status } from '@prisma/client';
import { NextRequest } from 'next/server';

type TParams = {
  params: Promise<{ name: string; slug: Status | string }>;
};

export async function GET(_: NextRequest, { params }: TParams) {
  try {
    const { name, slug } = await params;
    const tasks = await getTaskByStatus(name, slug as Status);
    return Response.json(tasks, { status: 200, statusText: 'OK' });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: TParams) {
  try {
    const { slug } = await params;
    const data = await request.json();
    const updatedTask = await updateTask(slug, data);
    return Response.json(updatedTask, { status: 200, statusText: 'OK' });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: TParams) {
  try {
    const { slug } = await params;
    const deletedTask = await deleteTask(slug);
    return Response.json(deletedTask, { status: 200, statusText: 'OK' });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
