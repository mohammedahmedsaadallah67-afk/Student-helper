import '@netlify/functions';
import { timingSafeEqual } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { getStore } from '@netlify/blobs';
import { database } from '../../db/index.js';
import { homework } from '../../db/schema.js';
function json(data: unknown, status = 200) {
  return Response.json(data, {status, headers:{'Cache-Control':'no-store'}});
}
export default async (request: Request) => {
  if (!['GET','POST'].includes(request.method)) return json({error:'Method not allowed'},405);
  try {
    if (request.method === 'POST') {
      const expected = Netlify.env.get('PUBLISHER_PASSWORD');
      const supplied = request.headers.get('X-Publisher-Password') || '';
      if (!expected || Buffer.byteLength(expected)!==Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected),Buffer.from(supplied))) {
        return json({error:'كلمة مرور الناشر غير صحيحة'},401);
      }
      const body = await request.json().catch(()=>null);
      if(body?.action === 'login') return json({ok:true});
      if(!body || typeof body.poster!=='string' || !body.poster.trim() || typeof body.text!=='string' || body.text.length>20000 || (!body.text.trim()&&!body.fileData)) return json({error:'بيانات الواجب ناقصة أو طويلة جداً'},400);
      let fileKey: string | null = null;
      let fileName: string | null = null;
      if(body.fileData) {
        if(typeof body.fileData!=='string' || body.fileData.length>2800000 || typeof body.fileName!=='string' || !/^data:[^,]*;base64,[A-Za-z0-9+/=]+$/.test(body.fileData)) return json({error:'المرفق غير صالح أو أكبر من ٢ ميغابايت'},400);
        fileKey = crypto.randomUUID();
        fileName = body.fileName.slice(0,200);
        await getStore('homework-files').set(fileKey,new Uint8Array(Buffer.from(body.fileData.split(',')[1],'base64')).buffer);
      }
      await database().insert(homework).values({poster:body.poster.trim().slice(0,100),text:body.text.trim(),date:new Date().toLocaleString('ar'),fileKey,fileName});
    }
    const file = new URL(request.url).searchParams.get('file');
    if(request.method==='GET' && file) {
      const [item] = await database().select().from(homework).where(eq(homework.fileKey,file));
      if(!item) return json({error:'المرفق غير موجود'},404);
      const data = await getStore('homework-files').get(file,{type:'arrayBuffer'});
      if(!data) return json({error:'المرفق غير موجود'},404);
      return new Response(data,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(item.fileName || 'attachment')}`,'X-Content-Type-Options':'nosniff'}});
    }
    const items = await database().select().from(homework).orderBy(asc(homework.id));
    return json({homework:items.map(({fileKey,...item})=>({...item,fileData:fileKey?`/.netlify/functions/homework?file=${encodeURIComponent(fileKey)}`:null}))});
  } catch { return json({error:'تعذّر الاتصال بخدمة الواجبات، حاول مرة أخرى'},503); }
};
