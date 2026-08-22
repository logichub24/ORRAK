import { useMemo, useState } from "react";
import { getToday } from "../lib/date";
import { getChallengeProgress, getDailyTip, getFocusLevel, getRankSnapshot } from "../lib/progression";
import {
  clearTodayRecordFromData,
  getDiffFromYesterday,
  getStatsFromData,
  getWeekRecordsFromData,
  loadStoredData,
  persistStoredData,
  resetAllData,
  saveResultToData,
} from "../lib/storage";

export function useDataService() {
  const [data, setData] = useState(() => loadStoredData());

  const save = (nextData) => {
    persistStoredData(nextData);
    setData(nextData);
  };

  const saveResult = (result) => {
    save(saveResultToData(data, result));
  };

  const updateProfile = (partialProfile) => {
    save({
      ...data,
      profile: {
        ...data.profile,
        ...partialProfile,
      },
    });
  };

  const clearTodayRecord = () => {
    save(clearTodayRecordFromData(data));
  };

  const resetProgress = () => {
    save(resetAllData(data));
  };

  const computed = useMemo(() => {
    const isTodayDone = data.records.some((record) => record.date === getToday());
    const todayResult = data.records.find((record) => record.date === getToday()) || null;
    const streak = data.streak || 0;
    const stats = getStatsFromData(data);
    const challenge = getChallengeProgress(streak);
    const levelInfo = getFocusLevel(stats.measuredDays, stats.allTimeBest, streak, data.totalPlays || 0);

    return {
      isTodayDone,
      todayResult,
      streak,
      diffFromYesterday: getDiffFromYesterday(data),
      weekRecords: getWeekRecordsFromData(data),
      stats,
      challenge,
      levelInfo,
      dailyTip: getDailyTip(),
      rankSnapshot: todayResult
        ? getRankSnapshot(data, todayResult, data.profile.preferredAgeGroup)
        : null,
    };
  }, [data]);

  return {
    data,
    saveResult,
    clearTodayRecord,
    resetProgress,
    updateProfile,
    ...computed,
  };
}
