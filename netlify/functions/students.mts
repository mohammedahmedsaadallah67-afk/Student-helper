import '@netlify/functions';
import { database } from '../../db/index.js';
import { studentRegistrations } from '../../db/schema.js';

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) {
      return json({ error: 'اسم الطالب غير صالح أو طويل جداً' }, 400);
    }
    if (!['register', 'login'].includes(body.action)) return json({ error: 'طلب غير صالح' }, 400);
    const lastLoginAt = body.action === 'login' ? new Date() : null;
    const db = database();
    if (lastLoginAt) {
      await db.insert(studentRegistrations).values({ name, lastLoginAt })
        .onConflictDoUpdate({ target: studentRegistrations.name, set: { lastLoginAt } });
    } else {
      await db.insert(studentRegistrations).values({ name }).onConflictDoNothing();
    }
    return json({ name });
  } catch {
    return json({ error: 'تعذّر تسجيل الطالب في الموقع. تأكد من الاتصال وحاول مرة أخرى.' }, 503);
  }
};
