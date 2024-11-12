interface Project {
  id: string;
  title: string;
  description: string;
  registryURL: string;
  logo: Parse.File;
  coverImage: Parse.File;
  metadata: Record<string, any>;
}
