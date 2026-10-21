// Deploy: supabase functions deploy turn-credentials
// Secrets: TURN_HOST, TURN_SHARED_SECRET. TURN_USERNAME is an expiry epoch + : + authenticated user id.
// Configure coturn with use-auth-secret and the SAME static-auth-secret on the TURN server.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(request.method!=='POST')return json({error:'Method Not Allowed'},405);
  const auth=request.headers.get('Authorization')||'';
  const jwt=auth.replace(/^Bearer\s+/i,'');
  if(!jwt)return json({error:'Not authenticated'},401);
  const url=Deno.env.get('SUPABASE_URL')||'';
  const anon=Deno.env.get('SUPABASE_ANON_KEY')||'';
  const host=Deno.env.get('TURN_HOST')||'';
  const secret=Deno.env.get('TURN_SHARED_SECRET')||'';
  if(!host||!secret||!url||!anon)return json({error:'TURN server not configured'},503);
  const supabase=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data,error}=await supabase.auth.getUser(jwt);
  if(error||!data.user)return json({error:'Unauthorized'},401);
  const expires=Math.floor(Date.now()/1000)+2*60*60;
  const username=`${expires}:${data.user.id}`;
  const hmacKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const mac=new Uint8Array(await crypto.subtle.sign('HMAC',hmacKey,new TextEncoder().encode(username)));
  const credential=btoa(String.fromCharCode(...mac));
  return json({iceServers:[
    {urls:'stun:stun.l.google.com:19302'},
    {urls:[`turn:${host}:3478?transport=udp`,`turn:${host}:3478?transport=tcp`,`turns:${host}:5349?transport=tcp`],username,credential}
  ], expiresAt:expires});
});
