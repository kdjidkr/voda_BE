import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Seoul");

export const kstDayjs = (...args: any[]) => {
  return dayjs(...args).tz();
};

/**
 * Returns today's date in KST (00:00:00)
 */
export const getTodayKst = () => {
  return dayjs().tz().startOf("day").toDate();
};

/**
 * Returns the start of the week (Monday) for a given date in KST
 */
export const getStartOfWeekKst = (date?: string | Date) => {
  return dayjs(date).tz().startOf("week").add(1, "day").toDate(); // dayjs week starts on Sunday, so add 1 day for Monday
};

/**
 * Returns the start of the month for a given date in KST
 */
export const getStartOfMonthKst = (date?: string | Date) => {
  return dayjs(date).tz().startOf("month").toDate();
};

/**
 * Returns the end of the month for a given date in KST
 */
export const getEndOfMonthKst = (date?: string | Date) => {
  return dayjs(date).tz().endOf("month").toDate();
};

/**
 * Formats a date to YYYY-MM-DD in KST
 */
export const formatKstDate = (date: string | Date) => {
  return dayjs(date).tz().format("YYYY-MM-DD");
};

export { dayjs };
