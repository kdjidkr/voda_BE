import { registration_type, user_gender } from "../../../generated/prisma/enums";

export class UserMeProfileDto {
  nickname!: string;
  email!: string;
  profile_image!: string | null;
  gender!: user_gender;
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
  accounts!: registration_type[];
}
