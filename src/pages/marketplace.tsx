import { Shop } from 'iconsax-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import KronosCustomerService from '@/services/KronosCustomerService';
import ProjectListView from '@/components/marketplace/ProjectListView';
import ProjectCard from '@/components/marketplace/ProjectCard';
import ProjectDetails from "@/components/marketplace/ProjectDetails";
import { Category, RowVertical, SearchNormal1 } from 'iconsax-react';

const Marketplace: React.FC = () => {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<string>('card');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Memoize the filtered projects to prevent unnecessary recalculations
  const filteredProjects = useMemo(() => {
    return projectList.filter((project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.registryURL.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projectList, searchQuery]);

  const fetchProjects = useCallback(async () => {
    try {
      const projects = await KronosCustomerService.getProjects();
      setProjectList(
        projects?.map((project) => ({
          id: project.id,
          title: project.attributes.title,
          description: project.attributes.description,
          logo: project.attributes.logo,
          coverImage: project.attributes.coverImage,
          registryURL: project.attributes.registryURL,
        })) || []
      );
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // View mode toggle logic (now updates local state)
  const toggleView = (view: string) => {
    setViewMode(view);
  };

  // Handle search bar input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle project card or list item click
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  return (
    <>
      {selectedProject ? (
        // Render Project Details
        <ProjectDetails project={selectedProject} onBack={() => setSelectedProject(null)} />

      ) : (
        <>
          {/* Header and View Toggle Section */}
          <div className='flex justify-between items-center p-2 rounded-lg bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark'>
            {/* Search Bar */}
            <div className='bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark flex-shrink-0 w-64 flex items-center rounded-sm h-8 py-1 px-2'>
              <SearchNormal1 size='24' />
              <input
                type='text'
                placeholder='Search'
                className='bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark ml-2 w-full focus:outline-none'
                onChange={handleSearchChange}
                value={searchQuery}
              />
            </div>

            {/* View Toggle Buttons */}
            <div className='flex items-center'>
              <button
                onClick={() => toggleView('card')}
                className={`p-0.5 rounded-sm ${
                  viewMode === 'card'
                    ? 'bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light'
                    : ''
                }`}
              >
                <Category size='20' variant={viewMode === 'card' ? 'Bold' : 'Linear'} />
              </button>
              <button
                onClick={() => toggleView('table')}
                className={`p-0.5 rounded-sm ${
                  viewMode === 'table'
                    ? 'bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light'
                    : ''
                }`}
              >
                <RowVertical size='20' variant={viewMode === 'table' ? 'Bold' : 'Linear'} />
              </button>
            </div>
          </div>

          {/* Content Section */}
          {filteredProjects.length > 0 ? (
            viewMode === 'table' ? (
              <ProjectListView
                projects={filteredProjects}
                className='mt-5'
                onProjectClick={handleProjectClick}
              />
            ) : (
              <div className='gap-5 grid grid-cols-2 xl:grid-cols-3 mt-5'>
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onProjectClick={() => handleProjectClick(project)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className='flex flex-col text-nomyx-text-light dark:text-nomyx-text-dark h-[80%] text-xl items-center justify-center w-full grow'>
              <Shop className='w-60 h-60' variant='Linear'/>
              <p>Is it The Holidays Already?</p>
              <p>This marketplace seems to be empty for now,</p>
              <p>come back later and check it out.</p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Marketplace;