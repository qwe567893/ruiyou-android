import fs from 'node:fs';
const path='android/app/src/main/AndroidManifest.xml';
if(!fs.existsSync(path)){console.error('请先执行 npx cap add android');process.exit(1)}
let xml=fs.readFileSync(path,'utf8');
const perms=['INTERNET','CAMERA','RECORD_AUDIO','MODIFY_AUDIO_SETTINGS'];
const blocks=perms.filter(p=>!xml.includes(`android.permission.${p}`)).map(p=>`    <uses-permission android:name="android.permission.${p}" />`).join('\n');
if(blocks)xml=xml.replace('</manifest>',blocks+'\n</manifest>');
const feature='<uses-feature android:name="android.hardware.camera" android:required="false" />';
if(!xml.includes('android.hardware.camera'))xml=xml.replace('</manifest>',`    ${feature}\n</manifest>`);
fs.writeFileSync(path,xml);
console.log('已设置音视频权限：CAMERA、RECORD_AUDIO、MODIFY_AUDIO_SETTINGS');
