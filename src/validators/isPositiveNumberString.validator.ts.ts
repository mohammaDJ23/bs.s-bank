import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint()
export class IsPositiveNumberString implements ValidatorConstraintInterface {
  public async validate(data: string, args: ValidationArguments) {
    return data && Math.sign(Number(data)) !== -1;
  }
}
