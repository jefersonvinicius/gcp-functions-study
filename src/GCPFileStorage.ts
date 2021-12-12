import { FileAttrs, FileStorage } from './interfaces';
import { Storage } from '@google-cloud/storage';
import { Env } from './config/env';
import path from 'path';
import { TMP_PATH } from './config';

const storage = new Storage();

export class GCPFileStorage implements FileStorage {
  async save(file: FileAttrs): Promise<string> {
    const fullPath = path.join(TMP_PATH, file.filename);
    const response = await storage.bucket(Env.BucketName).upload(fullPath, {
      destination: file.filename,
    });
    return response[0].metadata.mediaLink;
  }
}
