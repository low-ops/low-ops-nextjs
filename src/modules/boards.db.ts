import prisma from '../lib/db';
import seed from '../mocks/seed';
import { deleteImage, getImage, uploadImage } from './boards.storage';

export async function getBoards() {
  if (!prisma) return [];

  try {
    const boards = await prisma.board.findMany();
    if (boards.length > 0) {
      return boards;
    }

    await seed();
    const newBoards = await prisma.board.findMany();

    return newBoards;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getBoardByName(name: string) {
  if (!prisma) return null;
  try {
    const board = await prisma.board.findUnique({ where: { name } });
    return board;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function createBoard(name: string, image?: File | null | undefined) {
  if (!prisma) return null;

  try {
    const existingBoard = await prisma.board.findUnique({ where: { name } });
    if (existingBoard) {
      return { success: false, error: 'Board already exists' };
    }

    const imagePath = await uploadImage(image);
    const imageUrl = await getImage(imagePath);
    const board = await prisma.board.create({ data: { name, image: imageUrl } });
    return { board, success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to create board' };
  }
}

export async function deleteBoard(id: string) {
  if (!prisma) return null;
  try {
    const board = await prisma.board.delete({ where: { id } });
    await deleteImage(board.image);
    return { board, success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to delete board' };
  }
}
