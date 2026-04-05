import { Gender, RegistrationType } from "./auth.types";

export class SignUpRequestDto {
  email!: string;
  password?: string;
  name!: string;
  nickname!: string;
  birthDate!: string; // YYYY-MM-DD
  gender!: Gender;
  registrationType!: RegistrationType;
  oauthId?: string;
}
