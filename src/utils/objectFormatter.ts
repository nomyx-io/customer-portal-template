export const sanitizeProjects = (projects: Parse.Object<Project>[] | null): Parse.Object<Project>[] => {
  return (
    projects?.map((project) => {
      const attributes = project.attributes;

      return {
        ...project,
        attributes: {
          ...attributes,
          fields: typeof attributes.fields === "string" ? JSON.parse(attributes.fields) : attributes.fields,
        },
      };
    }) || []
  );
};
