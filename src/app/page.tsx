import BoardList from '@/components/boards/BoardList';
import CreateBoard from '@/components/boards/CreateBoard';

const Home = async () => {
  return (
    <div className="container mx-auto py-8 px-4 h-full w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Boards</h1>
        <CreateBoard />
      </div>

      <BoardList />
    </div>
  );
};

export default Home;
