import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriberDto {
  @IsNotEmpty({ message: 'Name không được để trống' })
  name: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Skill không được để trống' })
  @IsArray({ message: 'Skill có định dạng là array' })
  @IsString({ each: true, message: 'Mỗi skill phải có định dạng là string' })
  skills: string[];
}
