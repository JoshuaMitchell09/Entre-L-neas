// Compila el juego y lo empaqueta como aplicación de Windows (x64).
// Uso desde la raíz del proyecto:  npm run build:win
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = process.env.OUT_DIR || path.join(root, 'release');
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' });

run('npm run build');
const web = path.join(__dirname, 'web');
fs.rmSync(web, { recursive: true, force: true });
fs.cpSync(path.join(root, 'dist'), web, { recursive: true });
// Los audios propios no se empaquetan: se leen de la carpeta "audio" junto al .exe
for (const f of fs.readdirSync(path.join(web, 'audio'))) if (f !== 'LEEME.txt') fs.rmSync(path.join(web, 'audio', f));
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) run('npm install', __dirname);
run(`npx electron-packager . "Entre Lineas" --platform=win32 --arch=x64 --out="${out}" --overwrite --asar --executable-name=EntreLineas --ignore="^/build\\.cjs$" --app-copyright="Entre Lineas"`, __dirname);
const appDir = path.join(out, 'Entre Lineas-win32-x64');
(async () => {
// Ícono y datos del producto incrustados en el .exe (sin herramientas de Windows)
const R = await import('resedit');
const exePath = path.join(appDir, 'EntreLineas.exe');
const exe = R.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
const res = R.NtExecutableResource.from(exe);
const ico = R.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'assets', 'icon.ico')));
const groups = R.Resource.IconGroupEntry.fromEntries(res.entries);
R.Resource.IconGroupEntry.replaceIconsForResource(res.entries, groups.length ? groups[0].id : 1, groups.length ? groups[0].lang : 1033, ico.icons.map((i) => i.data));
const vi = R.Resource.VersionInfo.fromEntries(res.entries)[0];
const lang = vi.getAllLanguagesForStringValues()[0] || { lang: 1033, codepage: 1200 };
vi.setStringValues(lang, { ProductName: 'ENTRE LÍNEAS', FileDescription: 'ENTRE LÍNEAS · Fotógrafo de la Liga Tica', CompanyName: 'Entre Lineas', OriginalFilename: 'EntreLineas.exe', InternalName: 'EntreLineas', LegalCopyright: 'Entre Lineas' });
const v = require('./package.json').version.split('.').map(Number);
vi.setFileVersion(v[0], v[1], v[2], 0, lang.lang); vi.setProductVersion(v[0], v[1], v[2], 0, lang.lang);
vi.outputToResourceEntries(res.entries);
res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));
fs.mkdirSync(path.join(appDir, 'audio'), { recursive: true });
fs.copyFileSync(path.join(root, 'public', 'audio', 'LEEME.txt'), path.join(appDir, 'audio', 'LEEME.txt'));
fs.copyFileSync(path.join(__dirname, 'LEEME-WINDOWS.txt'), path.join(appDir, 'LEEME.txt'));
console.log('\nListo:', appDir);
})();
