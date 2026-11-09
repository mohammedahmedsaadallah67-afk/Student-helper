import { getStore } from "@netlify/blobs";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const store = getStore("student-homework");

  if (request.method === "GET") {
    const homework = await store.get("homework", { type: "json" }) || [];
    return json({ homework });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const expected = process.env.PUBLISHER_PASSWORD;
  const supplied = request.headers.get("X-Publisher-Password");
  if (!expected || supplied !== expected) {
    return json({ error: "كلمة مرور الناشر غير صحيحة" }, 401);
  }

  let item;
  try {
    item = await request.json();
  } catch {
    return json({ error: "بيانات غير صالحة" }, 400);
  }

  if (!item || typeof item.poster !== "string" || typeof item.text !== "string") {
    return json({ error: "بيانات الواجب ناقصة" }, 400);
  }

  const homework = await store.get("homework", { type: "json" }) || [];
  homework.push({
    poster: item.poster.slice(0, 100),
    date: String(item.date || ""),
    text: item.text.slice(0, 20000),
    fileName: item.fileName ? String(item.fileName).slice(0, 200) : null,
    fileData: item.fileData || null
  });

  await store.setJSON("homework", homework);
  return json({ ok: true, homework });
};
