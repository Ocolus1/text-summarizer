import { parseTextFile } from './parsers/text-parser';
import { parseDocxFile } from './parsers/docx-parser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const parseFile = async (file: File): Promise<string> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'txt':
      return await parseTextFile(file);
    case 'docx':
      return await parseDocxFile(file);
    default:
      throw new Error('Unsupported file type');
  }
};