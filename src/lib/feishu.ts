import { poiFields, type Poi } from "@/lib/poi";

type FeishuRecord = {
  record_id: string;
  fields: Record<string, unknown>;
};

type RecordsResponse = {
  code: number;
  msg?: string;
  data?: {
    items?: FeishuRecord[];
    has_more?: boolean;
    page_token?: string;
  };
};

const baseUrl = "https://open.feishu.cn/open-apis";

export async function getTenantAccessToken() {
  const response = await fetch(
    `${baseUrl}/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        app_id: process.env.FEISHU_APP_ID,
        app_secret: process.env.FEISHU_APP_SECRET,
      }),
    },
  );
  const body = (await response.json()) as {
    code: number;
    msg?: string;
    tenant_access_token?: string;
  };
  if (!response.ok || body.code !== 0 || !body.tenant_access_token) {
    throw new Error(`无法获取飞书租户令牌：${body.msg ?? response.statusText}`);
  }
  return body.tenant_access_token;
}

function text(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value))
    return value.map(text).filter(Boolean).join("、") || null;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return (
      [object.text, object.name, object.value].map(text).find(Boolean) ?? null
    );
  }
  return null;
}

function reviewText(value: unknown): string | null {
  const direct = text(value);
  if (direct) return direct;
  if (!value || typeof value !== "object") return null;

  const object = value as Record<string, unknown>;
  const preferredKeys = [
    "comment",
    "content",
    "description",
    "title",
    "summary",
    "remark",
  ];
  for (const key of preferredKeys) {
    const candidate = reviewText(object[key]);
    if (candidate) return candidate;
  }

  for (const key of ["data", "object_value", "fields", "value"]) {
    const nested = object[key];
    if (nested && nested !== value) {
      const candidate = reviewText(nested);
      if (candidate) return candidate;
    }
  }
  return null;
}

function images(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const attachment = item as Record<string, unknown>;
    const token = text(attachment.file_token ?? attachment.fileToken);
    if (!token) return [];
    const mimeType = text(attachment.type ?? attachment.mime_type);
    if (mimeType && !mimeType.startsWith("image/")) return [];
    return [{ token, name: text(attachment.name) }];
  });
}

function number(value: unknown): number | null {
  const stringValue = typeof value === "number" ? String(value) : text(value);
  if (stringValue === null) return null;
  const parsed = Number(stringValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function location(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  const coordinateString = text(entry.location);
  const [locationLongitude, locationLatitude] =
    coordinateString?.split(",").map((item) => Number(item.trim())) ?? [];
  const longitude =
    number(entry.longitude ?? entry.lng) ??
    (Number.isFinite(locationLongitude) ? locationLongitude : null);
  const latitude =
    number(entry.latitude ?? entry.lat) ??
    (Number.isFinite(locationLatitude) ? locationLatitude : null);
  if (longitude === null || latitude === null) return null;
  return {
    longitude,
    latitude,
    name:
      text(entry.name ?? entry.address ?? entry.full_address ?? entry.pname) ??
      "未命名地点",
    province: text(entry.province ?? entry.pname),
    city: text(entry.city ?? entry.cityname ?? entry.cname),
    district: text(entry.district ?? entry.adname),
  };
}

function toPoi(record: FeishuRecord): Poi | null {
  const place = location(record.fields[poiFields.location]);
  if (!place || text(record.fields[poiFields.status]) !== "已发布") return null;
  return {
    id: record.record_id,
    name: place.name,
    type: text(record.fields[poiFields.type]),
    rating: number(record.fields[poiFields.rating]),
    review: reviewText(record.fields[poiFields.review]),
    province: place.province,
    city: place.city,
    district: place.district,
    latitude: place.latitude,
    longitude: place.longitude,
    images: images(record.fields[poiFields.images]),
  };
}

export async function getPublishedPois(): Promise<Poi[]> {
  const token = await getTenantAccessToken();
  const appToken = process.env.FEISHU_BITABLE_APP_TOKEN!;
  const tableId = process.env.FEISHU_BITABLE_TABLE_ID!;
  const pois: Poi[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      `${baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    );
    url.searchParams.set("page_size", "500");
    if (pageToken) url.searchParams.set("page_token", pageToken);
    const response = await fetch(url, {
      next: { revalidate: 300, tags: ["pois"] },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await response.json()) as RecordsResponse;
    if (!response.ok || body.code !== 0) {
      throw new Error(`无法读取飞书地点：${body.msg ?? response.statusText}`);
    }

    const pagePois = (body.data?.items ?? [])
      .map(toPoi)
      .filter((poi): poi is Poi => poi !== null);
    pois.push(...pagePois);
    pageToken = body.data?.has_more ? body.data.page_token : undefined;
  } while (pageToken);

  return pois;
}
