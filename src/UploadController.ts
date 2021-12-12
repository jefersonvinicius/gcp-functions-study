import { Request, Response } from 'express';
import { busBoyFileParser } from './BusBoyFileParser';
import { Env } from './config/env';
import { GCPFileStorage } from './GCPFileStorage';
import { FileAttrs } from './interfaces';
import { LocalFileStorage } from './LocalFileStorage';

const localFileStorage = new LocalFileStorage();
const gcpFileStorage = new GCPFileStorage();

export class UploadController {
  constructor() {}

  handle = async (request: Request, response: Response) => {
    const isForSendToGCP = request.query?.uploader === 'gcp';

    try {
      const file = await busBoyFileParser.parse(request);
      if (isForSendToGCP) {
        console.log('Saving in GCP storage...');
        await gcpFileStorage.save(file);
      } else {
        console.log('Saving in local storage...');
        await localFileStorage.save(file);
      }
      return response.json({ file, url: createPublicFileURL(file) });
    } catch (error: any) {
      return response.status(500).json({ message: String(error) });
    }

    function createPublicFileURL(file: FileAttrs) {
      if (isForSendToGCP) return `https://storage.googleapis.com/${Env.BucketName}/${file.filename}`;
      return request.protocol + '://' + request.headers.host + '/public/' + file.filename;
    }
  };
}
