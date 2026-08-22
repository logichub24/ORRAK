export const launchConfig = {
  brand: {
    appNameKo: "오르락",
    appNameEn: "Orrak",
    logoUrl: "https://static.toss.im/appsintoss/32449/1ba1ec05-93f8-4fa1-b88c-f6835b6f2c95.png",
  },
  ads: {
    banner: {
      enabled: true,
      unitId: "ait.v2.live.a195cbf4d09d471f",
      placement: "home_record_bottom",
    },
    interstitial: {
      enabled: true,
      unitId: "ait.v2.live.93bf9f29910140f7",
      placement: "before_result_entry",
    },
    reward: {
      enabled: true,
      unitId: "ait.v2.live.7d2d0203c9dd4fdb",
      placement: "retry_and_deep_analysis",
    },
  },
};

export function getAdConfig(type) {
  return launchConfig.ads[type] || null;
}

export function hasLiveAdUnit(type) {
  const config = getAdConfig(type);
  return Boolean(config?.enabled && config?.unitId);
}
