import dayjs from "dayjs";
import Constants from "@/config/Constants";

export default class Utility {
  /** YYYY-MM-DD key for the given instant in the app timezone (Constants.APP_UTC_OFFSET_MINUTES). Uses toISOString so the result is identical regardless of the runtime's local timezone. */
  static getDateKey(date: Date): string {
    return new Date(date.getTime() + Constants.APP_UTC_OFFSET_MINUTES * 60_000)
      .toISOString()
      .slice(0, 10);
  }

  /** Today's YYYY-MM-DD key in the app timezone — the only sanctioned "what day is it" for queries, sweeps, and due-date math. */
  static getTodayDateKey(): string {
    return Utility.getDateKey(new Date());
  }

  static skipNulls<T extends object>(
    obj: T,
  ): { [K in keyof T]: T[K] extends null ? undefined : T[K] } {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, value === null ? undefined : value]),
    ) as any;
  }

  static getCurrentISOTimestamp() {
    return dayjs().toISOString();
  }
}
