import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint()
export class IsConsumers implements ValidatorConstraintInterface {
  public async validate(data: string[], args: ValidationArguments) {
    return Array.isArray(data) && data.every((item) => item.length < 100);
  }
}
