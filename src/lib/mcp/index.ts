import { defineMcp } from "@lovable.dev/mcp-js";
import aboutHigaet from "./tools/about-higaet";
import listAcademyCourses from "./tools/list-academy-courses";
import listServices from "./tools/list-services";

export default defineMcp({
  name: "higaet-mcp",
  title: "HIGAET",
  version: "0.1.0",
  instructions:
    "Public HIGAET information for AI assistants. Use `about_higaet` for an overview of the institute and its three divisions, `list_academy_courses` to browse Academy programs (with optional search), and `list_services` to browse HIGAET Technologies services (optionally by category).",
  tools: [aboutHigaet, listAcademyCourses, listServices],
});
