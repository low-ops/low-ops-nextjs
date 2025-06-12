import Image from 'next/image';

const NoImage = () => {
  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <Image src="/no-data.svg" alt="No data" width={80} height={120} />
      <p className="text-sm text-gray-400">No image uploaded</p>
    </div>
  );
};

export default NoImage;
