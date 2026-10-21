import fs from 'node:fs';

// Run after "npm run android:init". This file contains NO signing credentials.
// Credentials are supplied as environment variables only in the manual CI job.
const variables = 'android/variables.gradle';
const gradle = 'android/app/build.gradle';
if (!fs.existsSync(variables) || !fs.existsSync(gradle)) {
  throw new Error('Android project missing. Run npm run android:init first.');
}
const code = Number(process.env.RUIYOU_VERSION_CODE);
const name = process.env.RUIYOU_VERSION_NAME || '';
if (!Number.isSafeInteger(code) || code < 1 || code > 2100000000) throw new Error('Invalid versionCode');
if (!/^[0-9]+(\.[0-9]+){1,3}$/.test(name)) throw new Error('Invalid versionName');
let vars = fs.readFileSync(variables,'utf8');
for (const key of ['compileSdkVersion','targetSdkVersion']) {
  const re = new RegExp('(' + key + '\\s*=\\s*)\\d+');
  if (!re.test(vars)) throw new Error('Cannot find ' + key + ' in variables.gradle');
  vars = vars.replace(re, (_whole, prefix) => prefix + '36');
}
fs.writeFileSync(variables, vars);

let g = fs.readFileSync(gradle,'utf8');
if (g.includes('RUIYOU_MANAGED_RELEASE_SIGNING')) throw new Error('Signing settings already injected');
g += `
\n// RUIYOU_MANAGED_RELEASE_SIGNING: CI uses a private Play upload keystore, not the debug key.
android {
    defaultConfig {
        versionCode ${code}
        versionName '${name}'
    }
    signingConfigs {
        ruiyouUpload {
            storeFile file(System.getenv('ANDROID_KEYSTORE_PATH') ?: 'missing-upload-key.jks')
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD') ?: ''
            keyAlias System.getenv('ANDROID_KEY_ALIAS') ?: ''
            keyPassword System.getenv('ANDROID_KEY_PASSWORD') ?: ''
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.ruiyouUpload
        }
    }
}
`;
fs.writeFileSync(gradle,g);
console.log('Configured signed Play App Bundle build: Android API 36, version ' + name + ' (' + code + ').');
