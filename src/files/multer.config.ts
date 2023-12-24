import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { diskStorage } from 'multer';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  getRootPath = () => {
    return process.cwd();
  };

  ensureExists(targetDirectory: string) {
    fs.mkdir(targetDirectory, { recursive: true }, (error) => {
      if (!error) {
        console.log('Directory successfully created, or it already exists');
        return;
      }

      switch (error.code) {
        case 'EEXIST':
          break;

        case 'ENOTDIR':
          break;

        default:
          console.log(error);
          break;
      }
    });
  }

  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const folder = req?.headers?.folder_type ?? 'default';
          this.ensureExists(`public/images/${folder}`);
          cb(null, path.join(this.getRootPath(), `public/images/${folder}`));
        },
        filename: (req, file, cb) => {
          const extName = path.extname(file.originalname);
          const finalName = `${uuidv4()}${extName}`;
          cb(null, finalName);
        },
      }),

      fileFilter: (req, file, cb) => {
        const allowedFileTypes = [
          'jpg',
          'jpeg',
          'png',
          'gif',
          'pdf',
          'doc',
          'docx',
        ];

        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        const isValidTypeFile = allowedFileTypes.includes(fileExtension);

        if (!isValidTypeFile) {
          cb(
            new HttpException(
              'Invalid file type',
              HttpStatus.UNPROCESSABLE_ENTITY,
            ),
            null,
          );
        } else {
          cb(null, true);
        }
      },

      limits: {
        fileSize: 1024 * 1024 * 1,
      },
    };
  }
}
