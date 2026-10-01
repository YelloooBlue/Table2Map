export type Poi = {
  id: string;
  name: string;
  type: string | null;
  rating: number | null;
  review: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  imageCount: number;
};

export const poiFields = {
  location: "位置",
  status: "状态",
  type: "类型",
  review: "评价",
  rating: "评分",
  images: "图片",
} as const;

export function isConfigured() {
  return [
    process.env.FEISHU_APP_ID,
    process.env.FEISHU_APP_SECRET,
    process.env.FEISHU_BITABLE_APP_TOKEN,
    process.env.FEISHU_BITABLE_TABLE_ID,
  ].every(Boolean);
}
