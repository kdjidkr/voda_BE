import { Gender, RegistrationType } from "./auth.types";

export class SignUpInput {
  email!: string;
  hashedPassword?: string;
  name!: string;
  nickname!: string;
  formattedBirthDate!: Date;
  gender!: Gender;
  registrationType!: RegistrationType;
  oauthId?: string;
}

export class SignUpOutput {
  id!: string;
  nickname!: string;
}

export class AuthTokenPair {
  accessToken!: string;
  refreshToken!: string;
}
