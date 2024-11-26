import { Card } from "antd";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: Parse.Object<Project>;
  onProjectClick: () => void; // Add onProjectClick prop
}

export default function ProjectCard({ project, onProjectClick }: ProjectCardProps) {
  const themeStyle =
    "bg-white dark:bg-nomyx-dark2-dark border-nomyx-gray4-light dark:border-nomyx-gray4-dark text-nomyx-text-light dark:text-nomyx-text-dark rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out";

  return (
    <div onClick={onProjectClick} className={`p-3 ${themeStyle} cursor-pointer`}>
      {/* Image Section */}
      <div className="w-full h-48 relative rounded-lg overflow-hidden">
        <Image
          src={project.attributes.coverImage?.url() || "/default-image.png"} // Fallback if image is not available
          alt={project.attributes.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="mt-4">
        {/* Title */}
        <h2 className="text-lg font-bold">{project.attributes.title}</h2>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{project.attributes.description}</p>
      </div>
    </div>
  );
}
