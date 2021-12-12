import { LIMIT_FILE_SIZE } from '../config';

export class FileSizeLimitReached extends Error {
  constructor() {
    super(`File reached the limit size of ${LIMIT_FILE_SIZE} bytes`);
  }
}
