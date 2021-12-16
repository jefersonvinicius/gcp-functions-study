import Busboy from 'busboy';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import fs from 'fs';
import path, { basename, extname } from 'path';
import { inspect } from 'util';
import { LIMIT_FILE_SIZE, TMP_PATH } from './config';
import { FileAttrs, MultiFormDataParser } from './interfaces';

class BusBoyMultiFormDataParser implements MultiFormDataParser {
  parse<FormSchema = any>(request: Request): Promise<FormSchema | null> {
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

      const fields: any = {};
      const filesStreams: Promise<FileAttrs & { fieldName: string }>[] = [];

      busboy.on('file', (fieldName, file, filename, encoding, mimeType) => {
        let fileSizeTotal = 0;

        const filePath = createFilePath(extname(filename));
        const fileWriter = fs.createWriteStream(filePath);

        file.pipe(fileWriter);

        filesStreams.push(
          new Promise((resolveFile, rejectFile) => {
            file.on('end', () => {
              fileWriter.end();
              const filename = basename(filePath);
              resolveFile({ filename, size: fileSizeTotal, fieldName });
            });
            file.on('data', (chunk) => {
              fileSizeTotal += Buffer.byteLength(chunk);
            });
          })
        );
      });

      busboy.on('field', (fieldName, value) => {
        console.log('Field [' + fieldName + ']: value: ' + inspect(value));
        fields[fieldName] = value;
      });

      busboy.on('finish', async () => {
        console.log('Done parsing form!');
        const files = await Promise.all(filesStreams);
        const filesFields = Object.fromEntries(
          files.map((file) => [file.fieldName, { filename: file.filename, size: file.size } as FileAttrs])
        );
        resolve({ ...fields, ...filesFields });
      });

      busboy.on('error', (error: any) => {
        console.log('Error on parsing form');
        reject(error);
      });

      if (shouldUseGCPBodyData()) {
        busboy.end(request.rawBody);
      } else {
        request.pipe(busboy);
      }

      function createFilePath(extension: string) {
        return path.join(TMP_PATH, `${randomUUID()}${extension}`);
      }

      function shouldUseGCPBodyData() {
        return !!request?.rawBody;
      }
    });
  }
}

export const busBoyMultiFormDataParser = new BusBoyMultiFormDataParser();
