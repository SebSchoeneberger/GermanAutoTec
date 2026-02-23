import heroImg from '../assets/img/IMG_20210919_150803.jpg'

const Home = () => {
  return (
    <div>
      <div className="relative">
        <img
          src={heroImg}
          alt="Hero"
          className="w-full h-auto object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to GermanAutoTec</h1>
          <p className="text-lg text-white text-center mt-4">
            Your trusted partner for German auto maintenance and repairs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home; 