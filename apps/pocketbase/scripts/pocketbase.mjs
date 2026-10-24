#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = readFileSync(path.join(appDir, '.pocketbase-version'), 'utf8').trim();
const binDir = path.join(appDir, 'bin');
const exeName = process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase';
const exePath = path.join(binDir, exeName);
const versionStamp = path.join(binDir, '.version');

const dataDir = path.resolve(appDir, process.env.PB_DATA_DIR || 'pb_data');
const migrationsDir = path.join(appDir, 'pb_migrations');
const hooksDir = path.join(appDir, 'pb_hooks');
const publicDir = path.resolve(appDir, '../web/dist');

const superuserEmail = process.env.PB_SUPERUSER_EMAIL || 'admin@gibboni.it';
const superuserPassword = process.env.PB_SUPERUSER_PASSWORD || 'Gibboni#Admin2026';

function platformAsset() {
	const os = { linux: 'linux', darwin: 'darwin', win32: 'windows' }[process.platform];
	const arch = { x64: 'amd64', arm64: 'arm64' }[process.arch];
	if (!os || !arch) {
		throw new Error(`Piattaforma non supportata: ${process.platform}/${process.arch}`);
	}
	return `pocketbase_${version}_${os}_${arch}.zip`;
}

function extractFromZip(buffer, wanted) {
	const eocdSig = 0x06054b50;
	let eocd = -1;
	for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
		if (buffer.readUInt32LE(i) === eocdSig) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0) throw new Error('Archivio zip non valido');
	const entries = buffer.readUInt16LE(eocd + 10);
	let ptr = buffer.readUInt32LE(eocd + 16);
	for (let n = 0; n < entries; n++) {
		const method = buffer.readUInt16LE(ptr + 10);
		const compressedSize = buffer.readUInt32LE(ptr + 20);
		const nameLen = buffer.readUInt16LE(ptr + 28);
		const extraLen = buffer.readUInt16LE(ptr + 30);
		const commentLen = buffer.readUInt16LE(ptr + 32);
		const localOffset = buffer.readUInt32LE(ptr + 42);
		const name = buffer.toString('utf8', ptr + 46, ptr + 46 + nameLen);
		if (name === wanted) {
			const localNameLen = buffer.readUInt16LE(localOffset + 26);
			const localExtraLen = buffer.readUInt16LE(localOffset + 28);
			const start = localOffset + 30 + localNameLen + localExtraLen;
			const data = buffer.subarray(start, start + compressedSize);
			if (method === 0) return data;
			if (method === 8) return inflateRawSync(data);
			throw new Error(`Metodo di compressione zip non supportato: ${method}`);
		}
		ptr += 46 + nameLen + extraLen + commentLen;
	}
	throw new Error(`${wanted} non trovato nell'archivio`);
}

async function ensureBinary() {
	if (existsSync(exePath) && existsSync(versionStamp) && readFileSync(versionStamp, 'utf8').trim() === version) {
		return;
	}
	const asset = platformAsset();
	const url = `https://github.com/pocketbase/pocketbase/releases/download/v${version}/${asset}`;
	console.log(`[pocketbase] Scarico PocketBase v${version} (${asset})…`);
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Download fallito (${res.status}) da ${url}`);
	const zip = Buffer.from(await res.arrayBuffer());
	mkdirSync(binDir, { recursive: true });
	writeFileSync(exePath, extractFromZip(zip, exeName));
	if (process.platform !== 'win32') chmodSync(exePath, 0o755);
	writeFileSync(versionStamp, version);
	console.log(`[pocketbase] Installato in ${path.relative(process.cwd(), exePath)}`);
}

const baseArgs = [`--dir=${dataDir}`, `--migrationsDir=${migrationsDir}`, `--hooksDir=${hooksDir}`];

function runSync(args) {
	const result = spawnSync(exePath, [...args, ...baseArgs], { stdio: 'inherit' });
	if (result.status !== 0) process.exit(result.status ?? 1);
}

function prepareDatabase() {
	runSync(['migrate', 'up']);
	runSync(['superuser', 'upsert', superuserEmail, superuserPassword]);
}

function serve(extraArgs) {
	const child = spawn(exePath, ['serve', ...extraArgs, ...baseArgs], { stdio: 'inherit' });
	const stop = () => child.kill('SIGTERM');
	process.on('SIGINT', stop);
	process.on('SIGTERM', stop);
	child.on('exit', (code) => process.exit(code ?? 0));
}

const command = process.argv[2] || 'dev';

await ensureBinary();

if (command === 'download') {
	process.exit(0);
} else if (command === 'dev') {
	prepareDatabase();
	serve([`--http=${process.env.PB_HTTP || '127.0.0.1:8090'}`]);
} else if (command === 'start') {
	if (!existsSync(path.join(publicDir, 'index.html'))) {
		console.error('[pocketbase] Build del frontend mancante: esegui prima "npm run build".');
		process.exit(1);
	}
	prepareDatabase();
	serve([`--http=${process.env.PB_HTTP || '0.0.0.0:8090'}`, `--publicDir=${publicDir}`]);
} else {
	runSync(process.argv.slice(2));
}
