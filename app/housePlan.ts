export type PlanRect = {
  name: string;
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  material: string;
};

export const HOUSE_PLAN = {
  site: { width: 17.2, depth: 10.9, statedArea: 187.04 },
  footprint: { x1: 1.0, y1: 1.8, x2: 15.0, y2: 8.2 },
  levels: {
    one: { floor: 0.2, top: 3.1 },
    two: { floor: 3.3, top: 6.2 },
    half: { floor: 6.4, top: 9.2 },
  },
  courtyard: { name: "プライベートスカイコート", x1: 11.35, y1: 4.0, x2: 15.0, y2: 8.2 },
  void2f: { name: "2F LDK 吹抜け", x1: 4.8, y1: 1.8, x2: 11.35, y2: 5.5 },
  stairCore: { x1: 6.8, y1: 3.2, x2: 9.9, y2: 5.8 },
  stairOpening25: { x1: 6.8, y1: 3.2, x2: 8.6, y2: 5.5 },
  rooms: {
    one: [
      { name: "ビルトインガレージ 2台", key: "garage", x1: 1.0, y1: 1.8, x2: 6.8, y2: 8.0, material: "garage" },
      { name: "SIC", key: "sic", x1: 6.8, y1: 6.0, x2: 8.6, y2: 8.2, material: "entry" },
      { name: "正面玄関・ホール", key: "entry", x1: 6.8, y1: 4.2, x2: 8.6, y2: 6.0, material: "entry" },
      { name: "仕事部屋", key: "office", x1: 8.6, y1: 6.0, x2: 13.2, y2: 8.2, material: "office" },
      { name: "階段・1Fホール", key: "stair_1f", x1: 6.8, y1: 3.2, x2: 9.9, y2: 5.8, material: "circulation" },
      { name: "畳部屋 6畳＋押入れ", key: "tatami", x1: 10.0, y1: 4.8, x2: 13.2, y2: 8.2, material: "tatami" },
      { name: "洗面", key: "wash", x1: 13.2, y1: 1.8, x2: 14.4, y2: 3.4, material: "water" },
      { name: "脱衣・ランドリー", key: "laundry", x1: 14.2, y1: 1.8, x2: 15.0, y2: 6.2, material: "water" },
      { name: "浴室 1616", key: "bath", x1: 13.2, y1: 6.2, x2: 15.0, y2: 8.2, material: "water" },
      { name: "1Fトイレ", key: "toilet_1f", x1: 10.0, y1: 3.2, x2: 11.6, y2: 4.4, material: "water" },
      { name: "リネン収納", key: "linen", x1: 11.6, y1: 3.2, x2: 13.2, y2: 4.4, material: "storage" },
    ] satisfies PlanRect[],
    two: [
      { name: "LDK 35.2畳相当", key: "ldk", x1: 2.45, y1: 1.8, x2: 11.35, y2: 8.2, material: "ldk" },
      { name: "リビング", key: "living", x1: 2.45, y1: 5.2, x2: 6.8, y2: 8.2, material: "living" },
      { name: "ダイニング", key: "dining", x1: 6.8, y1: 5.2, x2: 11.35, y2: 8.2, material: "dining" },
      { name: "キッチン", key: "kitchen", x1: 6.8, y1: 1.8, x2: 11.35, y2: 5.2, material: "kitchen" },
      { name: "パントリー", key: "pantry", x1: 1.0, y1: 6.0, x2: 2.45, y2: 7.3, material: "service" },
      { name: "大型冷蔵庫", key: "fridge", x1: 1.0, y1: 7.3, x2: 2.45, y2: 8.2, material: "service" },
      { name: "2Fトイレ 前室遮蔽", key: "toilet_2f", x1: 1.0, y1: 4.5, x2: 2.45, y2: 6.0, material: "service" },
      { name: "2Fホール・サービス", key: "service_hall", x1: 1.0, y1: 1.8, x2: 2.45, y2: 4.5, material: "service" },
      { name: "プライベートスカイコート 9.5畳", key: "courtyard", x1: 11.35, y1: 4.0, x2: 15.0, y2: 8.2, material: "courtyard" },
    ] satisfies PlanRect[],
    half: [
      { name: "主寝室 8.5畳相当", key: "master", x1: 2.65, y1: 5.5, x2: 7.8, y2: 8.2, material: "bedroom" },
      { name: "子供室1 6畳相当", key: "child_1", x1: 7.8, y1: 5.5, x2: 11.4, y2: 8.2, material: "bedroom" },
      { name: "子供室2 6畳相当", key: "child_2", x1: 11.4, y1: 5.5, x2: 15.0, y2: 8.2, material: "bedroom" },
      { name: "WIC 3畳以上", key: "wic", x1: 1.0, y1: 3.5, x2: 3.7, y2: 5.3, material: "storage" },
      { name: "2.5Fトイレ", key: "toilet_25f", x1: 3.7, y1: 3.5, x2: 4.8, y2: 4.5, material: "service" },
      { name: "2.5Fホール", key: "hall_25f", x1: 2.7, y1: 3.5, x2: 4.8, y2: 5.5, material: "circulation" },
    ] satisfies PlanRect[],
  },
  furniture: {
    two: [
      { name: "ソファ", x1: 3.6, y1: 6.4, x2: 6.7, y2: 7.5, kind: "sofa" },
      { name: "TV壁", x1: 2.58, y1: 5.4, x2: 2.8, y2: 7.9, kind: "tv_wall" },
      { name: "コーヒーテーブル", x1: 4.2, y1: 5.4, x2: 5.9, y2: 6.2, kind: "coffee" },
      { name: "ダイニングテーブル", x1: 7.7, y1: 6.0, x2: 10.5, y2: 7.1, kind: "dining" },
      { name: "アイランド", x1: 7.5, y1: 2.7, x2: 10.3, y2: 3.7, kind: "island" },
      { name: "作業台", x1: 7.1, y1: 2.05, x2: 10.9, y2: 2.35, kind: "counter" },
    ],
    one: [
      { name: "仕事机", x1: 9.0, y1: 6.4, x2: 11.2, y2: 7.2, kind: "desk" },
      { name: "本棚", x1: 12.0, y1: 6.1, x2: 12.8, y2: 8.0, kind: "shelf" },
      { name: "洗濯機・乾燥機", x1: 14.0, y1: 2.3, x2: 14.8, y2: 4.3, kind: "washer" },
      { name: "浴槽", x1: 13.5, y1: 6.5, x2: 14.7, y2: 7.8, kind: "tub" },
    ],
    half: [
      { name: "主寝室ベッド", x1: 3.3, y1: 6.0, x2: 5.7, y2: 7.7, kind: "bed" },
      { name: "子供室1ベッド", x1: 8.3, y1: 5.9, x2: 10.1, y2: 7.2, kind: "bed" },
      { name: "子供室2ベッド", x1: 11.9, y1: 5.9, x2: 13.7, y2: 7.2, kind: "bed" },
    ],
  },
} as const;

export type HousePlan = typeof HOUSE_PLAN;
