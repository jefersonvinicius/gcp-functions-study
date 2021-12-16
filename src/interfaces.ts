import { Request } from 'express';

export type FileAttrs = {
  size: number;
  filename: string;
};

export interface MultiFormDataParser {
  parse(request: Request): Promise<FileAttrs | null>;
}

export interface FileStorage {
  save(file: FileAttrs): Promise<string>;
}
