export const KNOWLEDGE_SOURCES = [
  {
    id: "ffg",
    title: "FreeFocusGames",
    url: "https://github.com/loethen/freefocusgames",
    kind: "open-source-app",
    notes: "주의력/반응속도 중심 게임 패턴 참고",
  },
  {
    id: "pebl",
    title: "PEBL",
    url: "https://github.com/stmueller/pebl",
    kind: "open-source-research-platform",
    notes: "심리 실험 구성과 반응시간 과제 구조 참고",
  },
];

export const KNOWLEDGE_PACK = {
  tips: [
    {
      text: "20-20-20 룰: 20분마다 20피트 거리를 20초 바라보며 눈과 전두엽 피로를 함께 낮춰보세요.",
      tags: ["vision", "break"],
      sourceId: "pebl",
    },
    {
      text: "물을 한 잔 마시면 멍한 느낌이 줄어들 수 있어요. 집중 전 수분 보충을 체크해보세요.",
      tags: ["hydration"],
      sourceId: "ffg",
    },
    {
      text: "4-7-8 호흡처럼 짧은 호흡 루틴은 측정 전 과긴장을 낮추는 데 도움이 됩니다.",
      tags: ["breathing", "calm"],
      sourceId: "pebl",
    },
    {
      text: "1분 정도 자리에서 일어나 하체를 움직이면 다시 각성 상태를 끌어올리기 쉽습니다.",
      tags: ["movement"],
      sourceId: "ffg",
    },
    {
      text: "측정 전에 알림과 쇼츠를 끊고 단일 과제 모드로 들어가는 것만으로 반응 흐름이 많이 안정됩니다.",
      tags: ["distraction", "dopamine"],
      sourceId: "ffg",
    },
  ],
  boosterRules: [
    {
      when: ["피곤", "잠", "졸림"],
      response:
        "지금은 완벽함보다 시동이 중요해요. '딱 5분만 버틴다'는 낮은 문턱으로 시작하면 집중 회로가 다시 붙기 쉽습니다.",
    },
    {
      when: ["커피", "카페인"],
      response:
        "카페인 버프가 올라온 타이밍일 수 있어요. 가장 중요한 한 가지를 먼저 끝내는 쪽이 효율이 좋습니다.",
    },
    {
      when: ["우울", "짜증", "불안"],
      response:
        "감정이 큰 날에는 과제를 더 잘게 쪼개는 편이 유리해요. 시선은 오직 첫 단계 하나에만 두세요.",
    },
  ],
  distractionRules: [
    {
      when: ["폰", "스마트폰", "유튜브", "쇼츠", "인스타"],
      response:
        "즉각 조치: 스마트폰을 비행기 모드로 바꾸거나 손 닿지 않는 곳으로 치워두세요. 시야에서 사라지는 순간 충동 빈도가 급격히 줄어듭니다.",
    },
    {
      when: ["소음", "사람", "말소리"],
      response:
        "즉각 조치: 귀마개, 노이즈 캔슬링, 혹은 비/카페 백색소음으로 외부 자극을 마스킹해보세요.",
    },
  ],
  restRules: [
    {
      condition: "high_falls",
      response:
        "실수가 반복될 땐 10분 정도 시각 피로 회복이 우선입니다. 멀리 보기와 자리 이탈을 함께 해보세요.",
    },
    {
      condition: "low_score",
      response:
        "점수가 많이 낮을 땐 10~15분 NSDR 또는 눈 감고 호흡만 보는 휴식이 회복에 더 유리합니다.",
    },
    {
      condition: "good_score",
      response:
        "이미 흐름이 좋습니다. 5분 스트레칭과 수분 보충만으로 다음 세션 효율을 지키기 좋습니다.",
    },
  ],
};
