import { Request, Response } from 'express';
import { busBoyMultiFormDataParser } from './BusBoyMultiFormDataParser';
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
    console.log('Content Type: ', request.headers['content-type']);
    // @ts-ignore
    console.log('rawBody:  ', request.rawBody);
    console.log('request.body', request.body);

    const isForSendToGCP = request.query?.uploader === 'gcp';

    try {
      const form = await busBoyMultiFormDataParser.parse<BodySchema>(request);
      console.log(form);

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
        console.log('Saving in GCP storage...');
        await gcpFileStorage.save(file);
      } else {
        console.log('Saving in local storage...');
        await localFileStorage.save(file);
      }
    }
  };
}
