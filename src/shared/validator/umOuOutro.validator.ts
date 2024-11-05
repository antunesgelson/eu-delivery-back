import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function UmOuOutroValidator(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isOneOrOther',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                 
                    return (!!value && !relatedValue) || (!value && !!relatedValue);
                },
                defaultMessage(args: ValidationArguments) {
                    return `Only one of ${args.property} or ${args.constraints[0]} should be provided, not both or none.`;
                }
            }
        });
    };
}
