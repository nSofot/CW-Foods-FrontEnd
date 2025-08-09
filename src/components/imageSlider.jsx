import { useRef, useState } from "react";

export default function ImageSlider({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  const scrollThumbnails = (direction) => {
    const scrollAmount = 100;
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        [direction === "left" || direction === "right" ? "left" : "top"]:
          direction === "up" || direction === "left"
            ? -scrollAmount
            : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full md:w-[600px] flex flex-col md:flex-row overflow-hidden">
      {/* ── Large Image ── */}
      <div className="w-full md:w-auto aspect-square md:aspect-auto md:h-[500px] rounded-2xl">
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {/* ── Thumbnails ── */}
      <div className="w-full md:w-[100px] h-[100px] md:h-[500px] relative flex md:flex-col items-center justify-center flex-none">
        {/* Desktop Arrows */}
        <button
          className="hidden md:block absolute top-2 z-10 bg-white p-1 rounded-full shadow-md"
          onClick={() => scrollThumbnails("up")}
        >
          ↑
        </button>

        {/* Mobile Arrows */}
        <button
          className="md:hidden absolute left-2 z-10 bg-white p-1 rounded-full shadow-md"
          onClick={() => scrollThumbnails("left")}
        >
          ←
        </button>

        {/* Thumbnails */}
        <div
          ref={scrollRef}
          className="flex w-full h-full overflow-x-auto md:overflow-y-auto px-4 py-2 space-x-2 md:flex-col md:space-x-0 md:space-y-2"
        >
          {images.map((src, index) => (
            <img
              key={index}
              src={src}
              onClick={() => setCurrentIndex(index)}
              className={
                "cursor-pointer object-cover rounded-xl transition-all " +
                "w-[60px] h-[60px] md:w-[80px] md:h-[80px] " +
                (index === currentIndex
                  ? "border-4 border-yellow-400"
                  : "hover:border-4 hover:border-yellow-300")
              }
              alt={`Thumbnail ${index + 1}`}
            />
          ))}
        </div>

        <button
          className="hidden md:block absolute bottom-2 z-10 bg-white p-1 rounded-full shadow-md"
          onClick={() => scrollThumbnails("down")}
        >
          ↓
        </button>

        <button
          className="md:hidden absolute right-2 z-10 bg-white p-1 rounded-full shadow-md"
          onClick={() => scrollThumbnails("right")}
        >
          →
        </button>
      </div>
    </div>
  );
}