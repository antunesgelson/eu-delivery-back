import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { GetCodeService } from "./services/getCode.service";

@Module({
    controllers: [AuthController],
    providers: [GetCodeService]
})
export class AuthModules {

}