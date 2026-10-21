import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
test('RUIYOU uses guarded SQL relationships and user-scoped messages',()=>{
  const sql=read('supabase/schema.sql');
  for(const name of ['profiles','friend_requests','friendships','messages','posts','call_sessions','call_signals']) {
    assert.match(sql,new RegExp(`alter table public\\.${name} enable row level security`));
  }
  assert.match(sql,/create or replace function public\.accept_friend_request/);
  assert.match(sql,/create or replace function public\.set_call_status/);
  assert.match(sql,/public\.are_friends\(caller_id,callee_id\)/);
});
test('WebRTC uses authenticated server-generated TURN credentials, never embeds server secret',()=>{
  const code=read('src/lib/call.js');
  assert.match(code,/getIceServers\(\)/);
  assert.doesNotMatch(code,/TURN_SHARED_SECRET/);
  assert.match(read('supabase/functions/turn-credentials/index.ts'),/crypto\.subtle\.sign/);
});
test('Android permissions are configured in build scripts',()=>{
  const code=read('scripts/android-permissions.mjs');
  for(const p of ['INTERNET','CAMERA','RECORD_AUDIO','MODIFY_AUDIO_SETTINGS'])assert.match(code,new RegExp(p));
});
