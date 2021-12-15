import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { UploadController } from './UploadController';

const app = express();

const uploadController = new UploadController();

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '/../uploads')));
app.post('/upload', uploadController.handle);

export default app;
