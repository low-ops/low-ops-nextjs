import { getImage, uploadImage } from '../modules/boards.storage';
import prisma from './prisma';

export async function getBoards() {
  try {
    const boards = await prisma.board.findMany();
    return boards;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getBoardByName(name: string) {
  try {
    const board = await prisma.board.findUnique({ where: { name } });
    return board;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function createBoard(name: string, image: File) {
  try {
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
  try {
    const board = await prisma.board.delete({ where: { id } });

    return { board, success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to delete board' };
  }
}
