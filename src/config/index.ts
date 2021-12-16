import { tmpdir } from 'os';
import path from 'path';

export const LIMIT_FILE_SIZE = 10 * 1024 * 1024;

export const TMP_PATH = tmpdir();

export const UPLOADS_PATH = path.join(__dirname, '..', '..', 'uploads');
