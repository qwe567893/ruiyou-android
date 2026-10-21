import fs from 'node:fs';
import path from 'node:path';
const source='assets/android-icons';
const res='android/app/src/main/res';
if(!fs.existsSync(res)) throw new Error('Android 项目未生成；请先运行 npx cap add android');
for(const type of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']){
  for(const image of ['ic_launcher.png','ic_launcher_round.png']){
    const dest=path.join(res,`mipmap-${type}`); fs.mkdirSync(dest,{recursive:true});
    fs.copyFileSync(path.join(source,`mipmap-${type}`,image),path.join(dest,image));
  }
}
fs.mkdirSync(path.join(res,'drawable'),{recursive:true});
fs.copyFileSync(path.join(source,'ruiyou_foreground.png'),path.join(res,'drawable','ruiyou_foreground.png'));
const adaptive=`<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ruiyou_foreground" />
</adaptive-icon>\n`;
fs.mkdirSync(path.join(res,'mipmap-anydpi-v26'),{recursive:true});
for(const name of ['ic_launcher.xml','ic_launcher_round.xml']) fs.writeFileSync(path.join(res,'mipmap-anydpi-v26',name),adaptive);
console.log('已更新瑞友 Android 启动图标');
