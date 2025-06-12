import { Status } from '@prisma/client';
import prisma from './prisma';

export async function createTask(title: string, boardName: string) {
  try {
    const board = await prisma.board.findUnique({ where: { name: boardName } });
    if (!board) {
      throw new Error('Board not found');
    }

    const newTask = await prisma.task.create({ data: { title, boardId: board.id } });
    return newTask;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getTaskByStatus(boardName: string, status: Status) {
  try {
    const board = await prisma.board.findUnique({ where: { name: boardName } });
    if (!board) {
      throw new Error('Board not found');
    }
    const tasks = await prisma.task.findMany({ where: { boardId: board.id, status } });
    return tasks;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function updateTask(id: string, data: { title?: string; description?: string; status?: Status }) {
  try {
    const updatedTask = await prisma.task.update({ where: { id }, data });
    return updatedTask;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deleteTask(id: string) {
  try {
    await prisma.task.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
