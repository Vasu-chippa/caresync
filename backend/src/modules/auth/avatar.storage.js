import fs from 'fs/promises';
import path from 'path';

const AVATARS_DIR = path.resolve(process.cwd(), 'uploads', 'avatars');

export const ensureAvatarsDirectory = async () => {
  await fs.mkdir(AVATARS_DIR, { recursive: true });
  return AVATARS_DIR;
};

export const getAvatarFilePath = (avatarPath) => {
  const safeRelativePath = String(avatarPath || '').replace(/^\/+/, '');
  return path.resolve(process.cwd(), safeRelativePath);
};
