import { registration_type, user_gender } from "../../generated/prisma/enums";

export type UserMeBaseProfile = {
  user_id: string;
  nickname: string;
  email: string;
  profile_image: string | null;
  gender: user_gender;
  birth_date: Date;
  oauth_accounts: {
    registration_type: registration_type;
  }[];
};
