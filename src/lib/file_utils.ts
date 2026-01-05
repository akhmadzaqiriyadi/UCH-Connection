import { join } from 'path';
import { unlink } from 'fs/promises';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const validateImage = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }
    return true;
};

export const saveFile = async (file: File, folder: string = 'ruangan'): Promise<string> => {
    validateImage(file);

    const uniqueSuffix = crypto.randomUUID();
    const ext = file.name.split('.').pop();
    const filename = `${uniqueSuffix}.${ext}`;
    
    // Path relative to public folder
    const relativePath = `/uploads/${folder}/${filename}`;
    // Absolute disk path
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    const diskPath = join(uploadDir, filename);

    await Bun.write(diskPath, file);

    return relativePath; // Return URL-ready path
};

export const deleteFile = async (relativePath: string) => {
    try {
        const diskPath = join(process.cwd(), 'public', relativePath);
        await unlink(diskPath);
    } catch (error) {
        console.error('Failed to delete file:', relativePath, error);
        // Ignore error if file doesn't exist
    }
};
