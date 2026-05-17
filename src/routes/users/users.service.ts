import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { registration_type, user_gender } from "../../generated/prisma/enums";
import { Gender, RegistrationType } from "../auth/dto/auth.types";
import { UserMeResponseDto } from "./dto/users.res.dto";
import { usersRepository } from "./users.repository";
import { kstDayjs } from "../../utils/date";

class UsersService {
  async getMe(userId: string): Promise<UserMeResponseDto> {
    const user = await usersRepository.findUserMeBaseProfile(userId);
    if (!user) {
      throw new HttpException(ErrorCode.USER001);
    }

    const [totalDiaries, diaryDates] = await Promise.all([
      usersRepository.countUserDiaries(userId),
      usersRepository.findUserDiaryDates(userId),
    ]);

    return {
      user_id: user.user_id,
      profile: {
        nickname: user.nickname,
        email: user.email,
        profile_image: user.profile_image,
        gender: this.toGender(user.gender),
        age: this.calculateAge(user.birth_date),
      },
      stats: {
        streak: this.calculateCurrentStreak(diaryDates),
        total_diaries: totalDiaries,
      },
      accounts: Array.from(
        new Set(
          user.oauth_accounts.map((account) =>
            this.toRegistrationType(account.registration_type),
          ),
        ),
      ),
    };
  }

  private toGender(value: user_gender): Gender {
    switch (value) {
      case "MALE":
        return Gender.MALE;
      case "FEMALE":
        return Gender.FEMALE;
      case "OTHER":
        return Gender.OTHER;
    }
  }

  private toRegistrationType(value: registration_type): RegistrationType {
    switch (value) {
      case "EMAIL":
        return RegistrationType.EMAIL;
      case "KAKAO":
        return RegistrationType.KAKAO;
      case "GOOGLE":
        return RegistrationType.GOOGLE;
      case "APPLE":
        return RegistrationType.APPLE;
      case "NAVER":
        return RegistrationType.NAVER;
    }
  }

  private calculateAge(birthDate: Date): number {
    const now = kstDayjs();
    const birth = kstDayjs(birthDate);
    
    return now.diff(birth, "year");
  }

  private calculateCurrentStreak(diaryDates: Date[]): number {
    if (diaryDates.length === 0) {
      return 0;
    }
 
    const dateSet = new Set(diaryDates.map((date) => this.toIsoDate(date)));
    const today = kstDayjs().startOf("day");
    const todayKey = today.format("YYYY-MM-DD");
    const yesterday = today.subtract(1, "day");
    const yesterdayKey = yesterday.format("YYYY-MM-DD");
 
    let cursor = today;
    if (dateSet.has(todayKey)) {
      cursor = today;
    } else if (dateSet.has(yesterdayKey)) {
      cursor = yesterday;
    } else {
      return 0;
    }
 
    let streak = 0;
 
    while (dateSet.has(cursor.format("YYYY-MM-DD"))) {
      streak += 1;
      cursor = cursor.subtract(1, "day");
    }
 
    return streak;
  }

  private toIsoDate(date: Date): string {
    return kstDayjs(date).format("YYYY-MM-DD");
  }
}

export const usersService = new UsersService();
