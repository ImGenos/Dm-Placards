import React from 'react';

interface ImageGalleryProps {
  title: string;
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ title, images }) => {
  return (
    <section className="w-full px-4 lg:px-0 pt-[50px] lg:pt-[100px] lg:max-w-[1200px] mx-auto flex flex-col items-center justify-center gap-12">
      <h2 className="text-4xl font-bold text-primary-200">{title}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {images.map((image, index) => (
          <div key={index} className="relative group block overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <img 
              src={image} 
              alt={`${title} Image ${index + 1}`}
              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-white text-lg font-semibold">View Image</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ImageGallery;
