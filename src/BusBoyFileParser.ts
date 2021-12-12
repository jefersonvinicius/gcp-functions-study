import Busboy from 'busboy';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import fs from 'fs';
import path, { basename, extname } from 'path';
import { inspect } from 'util';
import { LIMIT_FILE_SIZE, TMP_PATH } from './config';
import { FileSizeLimitReached } from './errors/FileSizeLimitReached';
import { FileAttrs, FileParser } from './interfaces';

class BusBoyFileParser implements FileParser {
  parse(request: Request): Promise<FileAttrs> {
    return new Promise((resolve, reject) => {
      const headers = {
        ...request.headers,
        'content-type': request.headers['content-type'] ?? '',
      };

      const busboy = new Busboy({
        headers,
        limits: {
          files: 1,
          fileSize: LIMIT_FILE_SIZE,
        },
      });

      let fileAttrs: FileAttrs | null = null;
      let fileSizeTotal = 0;

      busboy.on('file', (fieldName, file, filename, encoding, mimeType) => {
        const filePath = createFilePath(extname(filename));
        const fileWriter = fs.createWriteStream(filePath);

        file.pipe(fileWriter);

        console.log(
          'File [' + fieldName + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimeType
        );

        file.on('data', (data) => {
          fileSizeTotal += data.length;
        });

        file.on('end', () => {
          fileWriter.end();

          const newFileName = basename(filePath);
          fileAttrs = {
            filename: newFileName,
            size: fileSizeTotal,
          };
          console.log('File [' + fieldName + '] Finished');
        });

        file.on('limit', () => {
          console.log('File [' + fieldName + ']: Reached the limit of ' + LIMIT_FILE_SIZE);
          busboy.emit('error', new FileSizeLimitReached());
        });
      });

      busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
        console.log('Field [' + fieldname + ']: value: ' + inspect(val));
      });

      busboy.on('finish', () => {
        console.log('Done parsing form!');
        if (!fileAttrs) return;
        return resolve(fileAttrs);
      });

      busboy.on('error', (error: any) => {
        console.log('Error on parsing form');
        reject(error);
      });

      request.pipe(busboy);

      function createFilePath(extension: string) {
        return path.join(TMP_PATH, `${randomUUID()}${extension}`);
      }
    });
  }
}

export const busBoyFileParser = new BusBoyFileParser();
