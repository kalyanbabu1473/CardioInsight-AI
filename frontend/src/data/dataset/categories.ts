import { variables } from "./variables";

export const categories = [
  "All Categories",
  ...new Set(variables.map((v) => v.domain)),
];