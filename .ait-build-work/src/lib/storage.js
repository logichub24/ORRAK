import { getPastDate, getToday, getYesterday } from "./date";

export const DATA_KEY = "orrak-data-v3";

export const DEFAULT_DATA = {
  profile: {
    preferredAgeGroup: "\u0033\u0030\uB300",
  },
  records: [],
  streak: 0,
  lastDate: null,
  totalPlays: 0,
};

function getTimeSlotFromHour(hour) {
  if (hour >= 6 && hour < 8) return "오전 6~8시";
  if (hour >= 8 && hour < 10) return "오전 8~10시";
  if (hour >= 10 && hour < 12) return "오전 10~12시";
  if (hour >= 12 && hour < 15) return "오후 1~3시";
  if (hour >= 15 && hour < 18) return "오후 3~6시";
  if (hour >= 18 && hour < 21) return "오후 7~9시";
  return "밤 9시 이후";
}

function normalizeData(parsed) {
  return {
    ...DEFAULT_DATA,
    ...parsed,
    profile: {
      ...DEFAULT_DATA.profile,
      ...(parsed?.profile || {}),
    },
    records: Array.isArray(parsed?.records) ? parsed.records : [],
  };
}

function sortRecordsDesc(records = []) {
  return [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function calculateStreakAndLastDate(records = []) {
  const sorted = sortRecordsDesc(records);
  if (!sorted.length) {
    return {
      streak: 0,
      lastDate: null,
    };
  }

  let streak = 1;
  let cursor = new Date(sorted[0].date);

  for (let index = 1; index < sorted.length; index += 1) {
    const nextDate = new Date(sorted[index].date);
    const expected = new Date(cursor);
    expected.setDate(expected.getDate() - 1);

    if (nextDate.toISOString().slice(0, 10) !== expected.toISOString().slice(0, 10)) {
      break;
    }

    streak += 1;
    cursor = nextDate;
  }

  return {
    streak,
    lastDate: sorted[0].date,
  };
}

export function loadStoredData() {
  try {
    const item = window.localStorage.getItem(DATA_KEY);
    return item ? normalizeData(JSON.parse(item)) : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

export function persistStoredData(data) {
  window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function saveResultToData(data, result) {
  const today = getToday();
  const yesterday = getYesterday();
  const next = { ...normalizeData(data), records: [...normalizeData(data).records] };

  if (next.lastDate === yesterday) next.streak = (next.streak || 0) + 1;
  else if (next.lastDate !== today) next.streak = 1;

  next.lastDate = today;
  next.totalPlays = (next.totalPlays || 0) + 1;

  const hour = new Date().getHours();
  let timeOfDay = "\uC0C8\uBCBD";
  if (hour >= 6 && hour < 12) timeOfDay = "\uC544\uCE68";
  else if (hour >= 12 && hour < 18) timeOfDay = "\uC624\uD6C4";
  else if (hour >= 18) timeOfDay = "\uC800\uB141";

  const enrichedResult = { ...result, timeOfDay, timeSlot: getTimeSlotFromHour(hour) };
  const existing = next.records.find((record) => record.date === today);

  if (!existing || result.score > existing.score) {
    next.records = next.records.filter((record) => record.date !== today);
    next.records.unshift({ date: today, ...enrichedResult });
    next.records = next.records.slice(0, 30);
  }

  return next;
}

export function clearTodayRecordFromData(data) {
  const next = normalizeData(data);
  const records = sortRecordsDesc(next.records.filter((record) => record.date !== getToday()));
  const progress = calculateStreakAndLastDate(records);

  return {
    ...next,
    records,
    streak: progress.streak,
    lastDate: progress.lastDate,
  };
}

export function resetAllData(data) {
  return {
    ...DEFAULT_DATA,
    profile: {
      ...DEFAULT_DATA.profile,
      ...(data?.profile || {}),
    },
  };
}

export function getWeekRecordsFromData(data) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = getPastDate(6 - index);
    return data.records.find((record) => record.date === date) || null;
  });
}

export function getDiffFromYesterday(data) {
  const today = data.records.find((record) => record.date === getToday());
  const yesterday = data.records.find((record) => record.date === getYesterday());
  if (!today || !yesterday) return null;
  return today.score - yesterday.score;
}

export function getStatsFromData(data) {
  const week = getWeekRecordsFromData(data).filter(Boolean);
  const weekAvg = week.length
    ? Math.round(week.reduce((sum, record) => sum + record.score, 0) / week.length)
    : 0;
  const best = week.reduce((max, record) => Math.max(max, record.score), 0);
  const allTimeBest = data.records.reduce((max, record) => Math.max(max, record.score), 0);

  let bestDay = "\uB370\uC774\uD130 \uBD80\uC871";
  let bestTime = "\uB370\uC774\uD130 \uBD80\uC871";

  if (week.length > 0) {
    const bestRecord = week.reduce((prev, curr) => (prev.score > curr.score ? prev : curr));
    const date = new Date(bestRecord.date);
    const days = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
    bestDay = `${days[date.getDay()]}\uC694\uC77C`;
    bestTime = bestRecord.timeOfDay || "\uC624\uD6C4";
  }

  return {
    weekAvg,
    best,
    bestDay,
    bestTime,
    allTimeBest,
    measuredDays: data.records.length,
  };
}
