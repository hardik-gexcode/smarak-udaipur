// Adds the permissions SMARAK needs (camera AR, GPS check-in, voice) to the generated Android project.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = 'android/app/src/main/AndroidManifest.xml';
if (!existsSync(file)) {
  console.error('Android project not found. Run: npm run android:add');
  process.exit(1);
}
let xml = readFileSync(file, 'utf8');
const lines = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
  '<uses-feature android:name="android.hardware.sensor.gyroscope" android:required="false" />',
];
const missing = lines.filter((l) => !xml.includes(l.match(/android:name="([^"]+)"/)[1]));
if (missing.length) {
  xml = xml.replace('<application', missing.map((l) => `    ${l}\n`).join('') + '\n    <application');
  writeFileSync(file, xml);
}
console.log(missing.length ? `Patched manifest (+${missing.length})` : 'Manifest already patched');
