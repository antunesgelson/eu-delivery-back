import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";
import { DataSource } from "typeorm";


@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueValidator implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource, private configService: ConfigService) { }


    async validate(value: any, args: ValidationArguments): Promise<boolean> {

        const [tableName, columnName] = args.constraints;
        const prefixDb = this.configService.get<string>('PREFIX_DB');
        const repo = this.dataSource.getRepository(tableName)
        const found = await repo.findOne({ where: { [prefixDb + columnName]: value } });

        if (found && found.id == (args.object as any).id) return true;

        return !found;
    }
}

export function IsUnique(tableName: string, columnName: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {





        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [tableName, columnName],
            validator: IsUniqueValidator,
        });
    };
}
