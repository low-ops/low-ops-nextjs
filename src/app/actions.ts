'use server';

import { TCreateBoardData } from '@/lib/types';
import { createBoard, deleteBoard } from '@/modules/boards.db';
import { createTask, deleteTask, updateTask } from '@/modules/tasks.db';
import { Status } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createBoardAction(data: TCreateBoardData) {
  try {
    const res = await createBoard(data.name, data.image as File);
    revalidatePath('/boards/[slug]/page');
    return res;
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create board' };
  }
}

export async function deleteBoardAction(id: string) {
  try {
    const res = await deleteBoard(id);
    revalidatePath('/boards/[slug]/page');
    return res;
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete board' };
  }
}

export async function createTaskAction(title: string, boardName: string) {
  try {
    const res = await createTask(title, boardName);
    revalidatePath('/boards/[slug]/page');
    return res;
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create task' };
  }
}

export async function updateTaskAction(id: string, data: { title?: string; description?: string; status?: Status }) {
  try {
    const res = await updateTask(id, data);
    revalidatePath('/boards/[slug]/page');
    return res;
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update task' };
  }
}

export async function deleteTaskAction(id: string) {
  try {
    const res = await deleteTask(id);
    revalidatePath('/boards/[slug]/page');
    return res;
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete task' };
  }
}
