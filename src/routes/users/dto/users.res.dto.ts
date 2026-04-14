import { Gender, RegistrationType } from "../../auth/dto/auth.types";

export class UserMeProfileDto {
  nickname!: string;
  email!: string;
  profile_image!: string | null;
  gender!: Gender;
  age!: number;
}

export class UserMeStatsDto {
  streak!: number;
  total_diaries!: number;
}

export class UserMeResponseDto {
  user_id!: string;
  profile!: UserMeProfileDto;
  stats!: UserMeStatsDto;
  accounts!: RegistrationType[];
}
