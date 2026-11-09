import OpenAI from 'openai';
export default async (request: Request) => {
  if(request.method!=='POST') return new Response(null,{status:405});
  try {
    const body = await request.json();
    if(!Array.isArray(body.messages) || body.messages.length>60) return new Response(null,{status:400});
    const messages = body.messages.filter((m: any)=>['system','user','assistant'].includes(m.role)&&typeof m.content==='string').map((m: any)=>({role:m.role,content:m.content.slice(0,10000)}));
    const result = await new OpenAI().chat.completions.create({model:'gpt-4.1-mini',messages,max_tokens:1024});
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'تعذّر الاتصال بالمساعد'},{status:503}); }
};
