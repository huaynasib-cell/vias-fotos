/* Arma la carpeta www (lo que va dentro del APK) y ajusta permisos de Android */
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..'), WWW = path.join(R, 'www'), NM = path.join(R, 'node_modules');
function copiar(de, a) {
  const st = fs.statSync(de);
  if (st.isDirectory()) { fs.mkdirSync(a, { recursive: true }); fs.readdirSync(de).forEach(f => copiar(path.join(de, f), path.join(a, f))); }
  else { fs.mkdirSync(path.dirname(a), { recursive: true }); fs.copyFileSync(de, a); }
}
const fase = process.argv[2] || 'web';
if (fase === 'web') {
  fs.rmSync(WWW, { recursive: true, force: true });
  copiar(path.join(R, 'web'), WWW);
  copiar(path.join(NM, 'leaflet/dist/leaflet.js'), path.join(WWW, 'lib/leaflet/leaflet.js'));
  copiar(path.join(NM, 'leaflet/dist/leaflet.css'), path.join(WWW, 'lib/leaflet/leaflet.css'));
  copiar(path.join(NM, 'leaflet/dist/images'), path.join(WWW, 'lib/leaflet/images'));
  copiar(path.join(NM, 'xlsx/dist/xlsx.full.min.js'), path.join(WWW, 'lib/xlsx.full.min.js'));
  const F = path.join(NM, '@fontsource/source-sans-3');
  ['400', '600', '700', '800'].forEach(w => copiar(path.join(F, w + '.css'), path.join(WWW, 'lib/fuente/' + w + '.css')));
  copiar(path.join(F, 'files'), path.join(WWW, 'lib/fuente/files'));
  console.log('www lista');
}
if (fase === 'android') {
  const man = path.join(R, 'android/app/src/main/AndroidManifest.xml');
  let x = fs.readFileSync(man, 'utf8');
  const permisos = [
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-permission android:name="android.permission.CAMERA" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
    '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
    '<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />',
    '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
    '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />',
    '<uses-feature android:name="android.hardware.camera" android:required="false" />',
    '<uses-feature android:name="android.hardware.location.gps" android:required="false" />'
  ].filter(p => x.indexOf(p.split('"')[1]) < 0);
  x = x.replace('</manifest>', '    ' + permisos.join('\n    ') + '\n</manifest>');
  x = x.replace('<application', '<application\n        android:requestLegacyExternalStorage="true"');

  fs.writeFileSync(man, x);
  console.log('Permisos de Android agregados');
}

if (fase === 'iconos') {
  /* Genera los íconos y la pantalla de inicio a partir de web/icon.svg */
  const sharp = require('sharp');
  const svg = fs.readFileSync(path.join(R, 'web/icon.svg'));
  const A = path.join(R, 'assets'); fs.mkdirSync(A, { recursive: true });
  const rojo = { r: 179, g: 18, b: 31, alpha: 1 };
  (async () => {
    await sharp(svg, { density: 300 }).resize(1024, 1024).flatten({ background: rojo }).png().toFile(path.join(A, 'icon-only.png'));
    const chico = await sharp(svg, { density: 300 }).resize(640, 640).png().toBuffer();
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: chico, gravity: 'center' }]).png().toFile(path.join(A, 'icon-foreground.png'));
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: rojo } }).png().toFile(path.join(A, 'icon-background.png'));
    const medio = await sharp(svg, { density: 300 }).resize(800, 800).png().toBuffer();
    for (const n of ['splash.png', 'splash-dark.png'])
      await sharp({ create: { width: 2732, height: 2732, channels: 4, background: rojo } }).composite([{ input: medio, gravity: 'center' }]).png().toFile(path.join(A, n));
    for (const t of [192, 512]) await sharp(svg, { density: 300 }).resize(t, t).png().toFile(path.join(R, 'web/icon-' + t + '.png'));
    console.log('Íconos listos');
  })().catch(e => { console.error(e); process.exit(1); });
}
