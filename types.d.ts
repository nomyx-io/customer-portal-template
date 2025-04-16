interface Project extends Parse.Attributes {
  coverImage: Parse.File;
  createdAt: Date;
  description: string;
  fields?: DefaultField[] | string;
  industryTemplate: string;
  logo: Parse.File;
  title: string;
  updatedAt: Date;
  tradeDealId: number;
}

interface DefaultField {
  name: string;
  type: "text" | "number" | "date" | "boolean";
  key: string;
}

// Then extand that for each industry fields
interface CarbonCredit extends DefaultField {
  label: string;
  placeHolder: string;
  rules: any[];
}
