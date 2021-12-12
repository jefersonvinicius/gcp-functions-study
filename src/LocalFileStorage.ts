import fs from 'fs';
import { TMP_PATH, UPLOADS_PATH } from './config';
import { FileAttrs, FileStorage } from './interfaces';

export class LocalFileStorage implements FileStorage {
  async save(file: FileAttrs): Promise<string> {
    const sourcePath = TMP_PATH + `/${file.filename}`;
    const destinyPath = UPLOADS_PATH + `/${file.filename}`;
    fs.renameSync(sourcePath, destinyPath);
    return destinyPath;
  }
}
