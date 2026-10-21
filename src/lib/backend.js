import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = !!(url && anon && !url.includes('YOUR_PROJECT') && !anon.includes('YOUR_KEY'));
export const supabase = configured ? createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  realtime: { params: { eventsPerSecond: 10 } }
}) : null;

function verify({data,error}) { if(error) throw error; return data; }
const safe = (s) => String(s || '').trim();

export const backend = {
  async getUser() { const {data,error}=await supabase.auth.getUser(); if(error) throw error; return data.user; },
  async signUp(email,password,displayName) {
    return verify(await supabase.auth.signUp({ email:safe(email), password,
      options:{ data:{ display_name: safe(displayName).slice(0,30) } } }));
  },
  async signIn(email,password) { return verify(await supabase.auth.signInWithPassword({email:safe(email),password})); },
  async signOut() { return verify(await supabase.auth.signOut()); },
  async getProfile(id) { return verify(await supabase.from('profiles').select('id,display_name,bio,avatar,created_at').eq('id',id).single()); },
  async updateProfile(name,bio) { return verify(await supabase.from('profiles').update({display_name:safe(name).slice(0,30),bio:safe(bio).slice(0,160)}).eq('id',(await this.getUser()).id).select().single()); },
  async people(me,term='') {
    let q=supabase.from('profiles').select('id,display_name,bio,avatar').neq('id',me).order('created_at',{ascending:false}).limit(60);
    if(safe(term)) q=q.ilike('display_name',`%${safe(term).replace(/[%_,]/g,'')}%`);
    return verify(await q);
  },
  async requests(me) { return verify(await supabase.from('friend_requests').select('id,sender_id,recipient_id,status,created_at').or(`sender_id.eq.${me},recipient_id.eq.${me}`).order('created_at',{ascending:false}).limit(100)); },
  async requestFriend(recipientId) { return verify(await supabase.from('friend_requests').insert({recipient_id:recipientId}).select().single()); },
  async acceptRequest(id) { return verify(await supabase.rpc('accept_friend_request',{request_id:id})); },
  async declineRequest(id) { return verify(await supabase.rpc('decline_friend_request',{request_id:id})); },
  async friends(me) { return verify(await supabase.from('friendships').select('user_a,user_b,created_at').or(`user_a.eq.${me},user_b.eq.${me}`).order('created_at',{ascending:false})); },
  async messages(me,other) {
    return verify(await supabase.from('messages').select('id,sender_id,recipient_id,body,created_at')
      .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
      .order('created_at',{ascending:true}).limit(200));
  },
  async sendMessage(other,body) { return verify(await supabase.from('messages').insert({recipient_id:other,body:safe(body).slice(0,2000)}).select().single()); },
  async posts() { return verify(await supabase.from('posts').select('id,author_id,body,created_at').order('created_at',{ascending:false}).limit(60)); },
  async addPost(body) { return verify(await supabase.from('posts').insert({body:safe(body).slice(0,1000)}).select().single()); },
  async createCall(other) { return verify(await supabase.from('call_sessions').insert({callee_id:other}).select().single()); },
  async getCall(id) { return verify(await supabase.from('call_sessions').select('*').eq('id',id).single()); },
  async incoming(me) { return verify(await supabase.from('call_sessions').select('*').eq('callee_id',me).eq('status','ringing').gte('created_at',new Date(Date.now()-90000).toISOString()).order('created_at',{ascending:false}).limit(3)); },
  async activeCall(id) { return this.getCall(id); },
  async setCallStatus(id,status) { return verify(await supabase.rpc('set_call_status',{call_id:id,new_status:status})); },
  async signals(callId) { return verify(await supabase.from('call_signals').select('id,call_id,sender_id,type,payload,created_at').eq('call_id',callId).order('created_at',{ascending:true}).limit(500)); },
  async getIceServers() { const {data,error}=await supabase.functions.invoke('turn-credentials',{body:{}}); if(error) throw error; return data; },
  async signal(callId,type,payload) { return verify(await supabase.from('call_signals').insert({call_id:callId,type,payload}).select('id').single()); },
  subscribe(table, callback, filter = null) {
    const channel=supabase.channel(`${table}:${crypto.randomUUID()}`);
    channel.on('postgres_changes',{event:'*',schema:'public',table,...(filter?{filter}:{})},callback).subscribe();
    return ()=>{ void supabase.removeChannel(channel); };
  }
};
