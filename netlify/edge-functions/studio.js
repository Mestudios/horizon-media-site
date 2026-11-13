// Runs the studio (photo uploads behind one password). The code is in ../studio/.
import { createStudio } from "../studio/studio.js";

export default createStudio();

export const config = {
  path: ["/studio", "/studio/*", "/uploads/*", "/portfolio-photos.json", "/announcements.json"],
};
