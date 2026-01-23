import CategoryRepository from 'src/category/category.repository';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
export class CategoryExistsConstraint implements ValidatorConstraintInterface {
  validate(category: string) {
    return !!CategoryRepository.getBySlug(category);
  }
}

export function IsCategory(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: CategoryExistsConstraint,
    });
  };
}
