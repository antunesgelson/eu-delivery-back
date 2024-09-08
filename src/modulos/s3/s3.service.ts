import { Injectable } from "@nestjs/common";
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service{
    private s3;

    constructor(){

        console.log(process.env.S3_ACCESSKEYID,process.env.S3_SECRET,process.env.S3_ENDPOINT)
        this.s3 = new AWS.S3({
            accessKeyId: process.env.S3_ACCESSKEYID,
            secretAccessKey: process.env.S3_SECRET,
            endpoint: process.env.S3_ENDPOINT, // URL do seu MinIO
            s3ForcePathStyle: true, // necessário com MinIO
            signatureVersion: 'v4'
          });
    }

    async upload(file: Express.Multer.File,bucket:string){
        const uploadResult = await this.s3.upload({
            Bucket: bucket,
            Body: file.buffer,
            Key: `${Date.now()}-${file.originalname}`
          }).promise();
      
          return uploadResult;
    }

    async delete(key: string,bucket:string){
        const deleteResult = await this.s3.deleteObject({
            Bucket: bucket,
            Key: key
          }).promise();    
          return deleteResult;
    }
}