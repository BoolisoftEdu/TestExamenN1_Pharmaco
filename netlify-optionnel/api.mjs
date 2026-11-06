// Facultatif : remplace netlify/functions/api.mjs APRÈS mise en service Cloudflare.
export default async function handler(request){
 const base=process.env.CLOUDFLARE_ORIGIN;
 if(!base)return Response.json({error:'Configurer CLOUDFLARE_ORIGIN puis republier.'},{status:503});
 const source=new URL(request.url),target=new URL(source.pathname+source.search,base);
 if(target.protocol!=='https:'||target.host===source.host)return new Response('Origine invalide',{status:503});
 const headers=new Headers(request.headers);headers.delete('host');
 return fetch(target,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,duplex:'half',redirect:'manual'});
}
export const config={path:'/api/*'};
