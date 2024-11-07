import React, { useState } from 'react';
import Image from 'next/image';
import { EyeOutlined, FilterOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { Popover, Input, Button as AntButton } from 'antd';

interface ProjectListViewProps {
  projects: Project[];
  className?: string;
  onProjectClick: (project: Project) => void; // Add onProjectClick prop
}

export default function ProjectListView({
  projects,
  className,
  onProjectClick,
}: ProjectListViewProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Sort and Filter Logic
  const sortedAndFilteredProjects = projects
    .filter((project) =>
      project.title.toLowerCase().includes(filterQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortOrder) return 0;
      if (sortOrder === 'asc') {
        return a.title.localeCompare(b.title);
      } else {
        return b.title.localeCompare(a.title);
      }
    });

  // Toggle Sort Order
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) =>
      prevOrder === 'asc' ? 'desc' : prevOrder === 'desc' ? null : 'asc'
    );
  };

  // Handle filter input change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(e.target.value);
  };

  // Popover Content for Filter
  const filterContent = (
    <div className='p-2'>
      <Input
        placeholder="Filter by title"
        value={filterQuery}
        onChange={handleFilterChange}
        className='mb-2'
      />
      <AntButton type='primary' onClick={() => setFilterQuery('')}>
        Clear Filter
      </AntButton>
    </div>
  );

  return (
    <div
      className={`pt-0 pb-4 bg-white dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark rounded-lg ${className}`}
    >
      {/* Header */}
      <div className='flex items-center p-4 border-b bg-gray-100 dark:bg-nomyx-dark1-dark'>
        <div className='w-5/12 font-semibold flex items-center justify-between'>
          Title
          <div className='flex items-center'>
            <AntButton
              type="text"
              icon={
                sortOrder === 'asc' ? (
                  <SortAscendingOutlined title='Sort Ascending' />
                ) : sortOrder === 'desc' ? (
                  <SortDescendingOutlined title='Sort Descending' />
                ) : (
                  <SortAscendingOutlined title='Sort' />
                )
              }
              onClick={toggleSortOrder}
            />

            <Popover content={filterContent} title="Filter by Title" trigger="click">
              <AntButton
                type="text"
                icon={<FilterOutlined title='Filter' />}
              />
            </Popover>
          </div>
        </div>
        <div className='w-7/12 font-semibold pl-4'>
          Description
        </div>
      </div>

      {/* Project Rows */}
      {sortedAndFilteredProjects.map((project) => (
        <div
          key={project.id}
          className='flex items-center justify-between p-4 border-b hover:bg-gray-50 dark:hover:bg-nomyx-dark1-dark transition-all cursor-pointer'
        >
          <div className='w-5/12 flex items-center'>
            <div className='flex justify-center items-center pr-4 border-r'>
              {/* Eye Icon triggers onProjectClick */}
              <EyeOutlined
                className='text-xl cursor-pointer hover:text-blue-500'
                onClick={() => onProjectClick(project)}
              />
            </div>
            <div className='w-12 h-12 relative rounded overflow-hidden flex-shrink-0 ml-4'>
              <Image
                src={project.coverImage?.url() || '/default-image.png'}
                alt={project.title}
                fill
                className='object-cover'
              />
            </div>
            <h2 className='ml-4 text-lg font-semibold'>{project.title}</h2>
          </div>
          <div className='w-7/12 text-sm text-gray-600 dark:text-gray-400 pl-4 truncate'>
            {project.description}
          </div>
        </div>
      ))}
    </div>
  );
}
