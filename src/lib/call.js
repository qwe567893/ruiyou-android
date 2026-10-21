// One-to-one WebRTC calling. Supabase stores signaling events; SDP/media stay in WebRTC.
// STUN is useful for development, but a deployed TURN service is required for reliable mobile calls.
const fallbackIce = [{ urls: 'stun:stun.l.google.com:19302' }];

async function iceServersFromBackend(backend) {
  // TURN password must never be hard-coded into the APK. The authenticated
  // Edge Function issues expiring credentials from a secret kept server-side.
  try {
    const config = await backend.getIceServers();
    if (Array.isArray(config?.iceServers) && config.iceServers.length) return config.iceServers;
  } catch (error) {
    console.warn('TURN not configured; falling back to STUN-only:', error?.message || error);
  }
  return fallbackIce;
}

export class CallController {
  constructor(backend, me, notify) {
    this.db=backend; this.me=me; this.notify=notify;
    this.call=null; this.pc=null; this.local=null; this.remote=null;
    this.seen=new Set(); this.pending=[]; this.mic=true; this.cam=true;
    this.closed=false; this.busy=false; this.offerSent=false; this.ringStartedAt=null;
  }
  publish(status) { this.notify({status,call:this.call,local:this.local,remote:this.remote,mic:this.mic,cam:this.cam}); }
  async camera() {
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('当前设备不支持摄像头访问，请在安卓 App 内打开，并检查权限。');
    this.local=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});
    this.publish('摄像头已开启');
  }
  async createPeer() {
    const iceServers=await iceServersFromBackend(this.db);
    this.pc=new RTCPeerConnection({iceServers});
    this.remote=new MediaStream();
    for(const t of this.local.getTracks()) this.pc.addTrack(t,this.local);
    this.pc.ontrack=e=>{ if(e.streams?.[0]) this.remote=e.streams[0]; else if(!this.remote.getTracks().some(t=>t.id===e.track.id)) this.remote.addTrack(e.track); this.publish('已接通'); };
    this.pc.onicecandidate=e=>{ if(e.candidate && !this.closed) this.db.signal(this.call.id,'candidate',e.candidate.toJSON()).catch(err=>this.publish(`网络错误：${err.message}`)); };
    this.pc.onconnectionstatechange=()=>{
      const v=this.pc?.connectionState;
      if(v==='connected') this.publish('已接通');
      if(v==='failed') this.publish('网络连接失败，请检查 TURN 配置');
      if(v==='disconnected') this.publish('连接暂时中断');
    };
  }
  async dial(other) {
    await this.camera(); // Don't ring remote user until local camera permission succeeds.
    try {
      this.call=await this.db.createCall(other);
      this.ringStartedAt=Date.now();
      await this.createPeer(); this.startMonitoring(); this.publish('正在呼叫，等待对方接听…');
    } catch (e) { if(this.call) await this.db.setCallStatus(this.call.id,'ended').catch(console.warn); await this.cleanup(); throw e; }
  }
  async answer(incoming) {
    await this.camera();
    try {
      this.call=incoming; await this.createPeer(); this.startMonitoring();
      const updated=await this.db.setCallStatus(this.call.id,'accepted');
      if(updated.status!=='accepted') throw new Error('来电已结束');
      this.publish('等待对方建立视频连接…');
      await this.check();
    } catch(e) { await this.cleanup(); throw e; }
  }
  startMonitoring() {
    this.unsubscribeSignals=this.db.subscribe('call_signals',()=>this.check().catch(console.error),`call_id=eq.${this.call.id}`);
    this.unsubscribeCall=this.db.subscribe('call_sessions',()=>this.check().catch(console.error),`id=eq.${this.call.id}`);
    this.timer=setInterval(()=>this.check().catch(console.error),1400);
    void this.check();
  }
  async check() {
    if(this.closed||this.busy||!this.call) return;
    this.busy=true;
    try {
      const record=await this.db.getCall(this.call.id);
      // Avoid leaving a ringing call stuck forever when the recipient is offline.
      if (record.status==='ringing' && record.caller_id===this.me && this.ringStartedAt && Date.now()-this.ringStartedAt>65000) {
        await this.db.setCallStatus(record.id,'ended').catch(console.warn);
        this.publish('无人接听');
        await this.cleanup(); return;
      }
      if(['ended','declined'].includes(record.status)) { this.publish(record.status==='declined'?'对方已拒绝':'通话已结束'); await this.cleanup(); return; }
      if(record.status==='accepted' && this.call.caller_id===this.me && !this.offerSent) {
        this.offerSent=true;
        const offer=await this.pc.createOffer(); await this.pc.setLocalDescription(offer);
        await this.db.signal(this.call.id,'offer',{type:offer.type,sdp:offer.sdp});
        this.publish('正在建立加密音视频连接…');
      }
      const entries=await this.db.signals(this.call.id);
      for(const signal of entries) {
        if(this.closed) break;
        if(signal.sender_id===this.me||this.seen.has(signal.id)) continue;
        this.seen.add(signal.id);
        await this.handleSignal(signal);
      }
    } finally {this.busy=false;}
  }
  async handleSignal(signal) {
    if(signal.type==='offer') {
      if(this.pc.signalingState!=='stable') return;
      await this.pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      await this.flushCandidates();
      const answer=await this.pc.createAnswer(); await this.pc.setLocalDescription(answer);
      await this.db.signal(this.call.id,'answer',{type:answer.type,sdp:answer.sdp});
    } else if(signal.type==='answer') {
      if(this.pc.signalingState!=='have-local-offer') return;
      await this.pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      await this.flushCandidates();
    } else if(signal.type==='candidate') {
      if(this.pc.remoteDescription) await this.pc.addIceCandidate(new RTCIceCandidate(signal.payload));
      else this.pending.push(signal.payload);
    }
  }
  async flushCandidates() {
    const list=this.pending.splice(0);
    for(const payload of list) await this.pc.addIceCandidate(new RTCIceCandidate(payload));
  }
  toggleMic() {this.mic=!this.mic;this.local?.getAudioTracks().forEach(t=>t.enabled=this.mic);this.publish(this.mic?'麦克风已开启':'麦克风已关闭');}
  toggleCamera() {this.cam=!this.cam;this.local?.getVideoTracks().forEach(t=>t.enabled=this.cam);this.publish(this.cam?'摄像头已开启':'摄像头已关闭');}
  async flipCamera() {
    const old=this.local?.getVideoTracks()[0]; if(!old)return;
    const facing=this.facing==='environment'?'user':'environment';
    const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing}}});
    const fresh=next.getVideoTracks()[0];
    const sender=this.pc?.getSenders().find(s=>s.track?.kind==='video');
    try {await sender?.replaceTrack(fresh);this.local.removeTrack(old);this.local.addTrack(fresh);old.stop();this.facing=facing;fresh.enabled=this.cam;this.publish('摄像头已切换');}
    catch(e){fresh.stop();throw e;}
  }
  async hangup() {
    if(this.call && !this.closed) { try { await this.db.setCallStatus(this.call.id,'ended'); } catch(e) {console.warn(e);} }
    await this.cleanup();
  }
  async cleanup() {
    if(this.closed)return;this.closed=true;
    clearInterval(this.timer);this.unsubscribeSignals?.();this.unsubscribeCall?.();
    this.pc?.close();this.local?.getTracks().forEach(t=>t.stop());this.remote?.getTracks().forEach(t=>t.stop());
    this.publish('通话已结束');
    this.notify({status:'通话已结束',ended:true,call:this.call});
  }
}
