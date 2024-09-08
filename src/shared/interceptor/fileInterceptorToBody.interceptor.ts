import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FileInterceptorToBodyInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler):
        Observable<any> {
        const request = context.switchToHttp().getRequest();

        console.log(request.file)
        if (request.file) {
            request.body.file = request.file;
        }

        if (request.files) {
            if (request.files.imagens) {
                request.body.imagens = request.files.imagens;
            }
            if (request.files.documentos) {
                request.body.documentos = request.files.documentos;
            }
        }

        
        return next.handle();
    }
}
