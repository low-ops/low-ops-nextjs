import { createBoard, getBoards } from '@/modules/boards.db';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const boards = await getBoards();
    return Response.json({ boards }, { status: 200, statusText: 'OK' });
  } catch (error: unknown) {
    console.error(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const image = formData.get('image') as File;

    await createBoard(name, image);
    return Response.json({ name, image }, { status: 201, statusText: 'Created' });
  } catch (error: unknown) {
    console.error(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
