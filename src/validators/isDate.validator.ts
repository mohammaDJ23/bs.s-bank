import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint()
export class IsDate implements ValidatorConstraintInterface {
  public async validate(data: number, args: ValidationArguments) {
    return data && !isNaN(new Date(data).getTime());
  }
}
