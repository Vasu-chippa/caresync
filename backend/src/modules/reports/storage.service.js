import fs from 'fs/promises';
import path from 'path';

const REPORTS_DIR = path.resolve(process.cwd(), 'uploads', 'reports');

export const ensureReportsDirectory = async () => {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  return REPORTS_DIR;
};

export const getReportFilePath = (fileName) => {
  return path.resolve(REPORTS_DIR, fileName);
};

export const getReportsDirectory = () => REPORTS_DIR;
