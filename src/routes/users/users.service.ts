import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { usersRepository } from "./users.repository";
import { UserMeResponseDto } from "./dto/users.res.dto";

class UsersService {
  async getMe(userId: string): Promise<UserMeResponseDto> {
    const [user, totalDiaries, diaryDates] = await Promise.all([
      usersRepository.findUserMeBaseProfile(userId),
      usersRepository.countUserDiaries(userId),
      usersRepository.findUserDiaryDates(userId),
    ]);

    if (!user) {
      throw new HttpException(ErrorCode.USER001);
    }

    return {
      user_id: user.user_id,
      profile: {
        nickname: user.nickname,
        email: user.email,
        profile_image: user.profile_image,
        gender: user.gender,
        age: this.calculateAge(user.birth_date),
      },
      stats: {
        streak: this.calculateCurrentStreak(diaryDates),
        total_diaries: totalDiaries,
      },
      accounts: Array.from(
        new Set(user.oauth_accounts.map((account) => account.registration_type)),
      ),
    };
  }

  private calculateAge(birthDate: Date): number {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const birthYear = birthDate.getUTCFullYear();

    const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
    const dayDiff = now.getUTCDate() - birthDate.getUTCDate();
    const hasHadBirthdayThisYear =
      monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0);

    return hasHadBirthdayThisYear ? currentYear - birthYear : currentYear - birthYear - 1;
  }

  private calculateCurrentStreak(diaryDates: Date[]): number {
    if (diaryDates.length === 0) {
      return 0;
    }

    const dateSet = new Set(diaryDates.map((date) => this.toIsoDate(date)));
    const today = new Date();
    const todayKey = this.toIsoDate(today);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayKey = this.toIsoDate(yesterday);

    let cursor: Date;
    if (dateSet.has(todayKey)) {
      cursor = new Date(today);
    } else if (dateSet.has(yesterdayKey)) {
      cursor = new Date(yesterday);
    } else {
        return 0;
    }

    let streak = 0;

    while (dateSet.has(this.toIsoDate(cursor))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return streak;
  }

  private toIsoDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}

export const usersService = new UsersService();
