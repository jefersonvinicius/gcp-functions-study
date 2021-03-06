import { Request, Response } from 'express';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { busBoyMultiFormDataParser } from './BusBoyMultiFormDataParser';
import { TMP_PATH } from './config';
import { Env } from './config/env';
import { GCPFileStorage } from './GCPFileStorage';
import { FileAttrs } from './interfaces';
import { LocalFileStorage } from './LocalFileStorage';

const localFileStorage = new LocalFileStorage();
const gcpFileStorage = new GCPFileStorage();

type BodySchema = {
  file: FileAttrs;
  name: string;
};

export class UploadController {
  constructor() {}

  handle = async (request: Request, response: Response) => {
    const isForSendToGCP = request.query?.uploader === 'gcp';

    try {
      const form = await busBoyMultiFormDataParser.parse<BodySchema>(request);
      if (!form?.file) {
        return response.status(500).json({ message: 'Não conseguimos salvar seu arquivo :(' });
      }
      await saveFile(form.file);
      return response.json({ file: form.file, url: createPublicFileURL(form.file) });
    } catch (error: any) {
      return response.status(500).json({ message: String(error) });
    }

    function createPublicFileURL(file: FileAttrs) {
      if (isForSendToGCP) return `https://storage.googleapis.com/${Env.BucketName}/${file.filename}`;
      return request.protocol + '://' + request.headers.host + '/public/' + file.filename;
    }

    async function saveFile(file: FileAttrs) {
      if (isForSendToGCP) {
        await gcpFileStorage.save(file);
      } else {
        await localFileStorage.save(file);
      }
    }
  };
}
