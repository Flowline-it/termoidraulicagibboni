import seed from './seed.json';
import { DEMO_PASSWORDS } from './users';

const STORAGE_KEY = 'gibboni-demo-db-v1';
const AUTH_KEY = 'gibboni-demo-auth-v1';
const DAY = 86400000;

const schema = seed.schema;

class ClientResponseError extends Error {
	constructor(status, message, data = {}) {
		super(message);
		this.name = 'ClientResponseError';
		this.status = status;
		this.data = data;
		this.response = { code: status, message, data };
		this.isAbort = false;
	}
}

const safeStorage = {
	get(key) {
		try {
			return window.localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	set(key, value) {
		try {
			window.localStorage.setItem(key, value);
		} catch {
			return;
		}
	},
	remove(key) {
		try {
			window.localStorage.removeItem(key);
		} catch {
			return;
		}
	},
};

const pad = (n, l = 2) => String(n).padStart(l, '0');

const toPbDate = (d) =>
	`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}Z`;

const nowPb = () => toPbDate(new Date());

const randomId = () => {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let out = '';
	const buf = new Uint8Array(15);
	(window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(buf) : buf.forEach((_, i) => (buf[i] = Math.random() * 256));
	buf.forEach((b) => (out += chars[b % chars.length]));
	return out;
};

const normalizeDate = (v) => {
	if (v === null || v === undefined || v === '') return '';
	if (v instanceof Date) return toPbDate(v);
	const s = String(v).trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00.000Z`;
	if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(s)) return s;
	const parsed = new Date(s.includes('T') || s.endsWith('Z') ? s : s.replace(' ', 'T') + 'Z');
	return Number.isNaN(parsed.getTime()) ? '' : toPbDate(parsed);
};

const shiftDate = (v, days) => {
	if (!v) return v;
	const m = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(v);
	if (!m) return v;
	const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) + days * DAY);
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}${m[4]}`;
};

const buildInitialState = () => {
	const today = new Date();
	const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
	const [ay, am, ad] = seed.anchor.split('-').map(Number);
	const diffDays = Math.round((todayUtc - Date.UTC(ay, am - 1, ad)) / DAY);
	const shift = Math.round(diffDays / 7) * 7;
	const base = Date.now() - 60 * DAY;
	const records = {};
	let tick = 0;
	for (const [name, list] of Object.entries(seed.records)) {
		const fields = schema[name] || {};
		records[name] = list.map((rec) => {
			const r = { ...rec };
			for (const [f, def] of Object.entries(fields)) {
				if (def.type === 'date' && r[f]) r[f] = shiftDate(r[f], shift);
			}
			const stamp = toPbDate(new Date(base + tick++ * 60000));
			r.created = stamp;
			r.updated = stamp;
			return r;
		});
	}
	return { version: 1, seededAt: new Date().toISOString(), records };
};

let state = null;

const loadState = () => {
	const raw = safeStorage.get(STORAGE_KEY);
	if (raw) {
		try {
			const parsed = JSON.parse(raw);
			if (parsed && parsed.version === 1 && parsed.records) return parsed;
		} catch {
			return buildInitialState();
		}
	}
	return buildInitialState();
};

const persist = () => safeStorage.set(STORAGE_KEY, JSON.stringify(state));

const db = () => {
	if (!state) {
		state = loadState();
		persist();
	}
	return state.records;
};

export const resetDemoData = () => {
	state = buildInitialState();
	persist();
};

const fileUrls = new Map();

const coerce = (def, value) => {
	if (!def) return value;
	switch (def.type) {
		case 'number': {
			const n = Number(value);
			return value === '' || value === null || value === undefined || Number.isNaN(n) ? 0 : n;
		}
		case 'bool':
			return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
		case 'date':
		case 'autodate':
			return normalizeDate(value);
		case 'relation':
		case 'select':
		case 'file':
			if (def.multi) {
				if (Array.isArray(value)) return value.filter(Boolean);
				return value ? [value] : [];
			}
			if (Array.isArray(value)) return value[0] || '';
			return value === null || value === undefined ? '' : value;
		case 'json':
			return value ?? null;
		default:
			return value === null || value === undefined ? '' : String(value);
	}
};

const emptyValue = (def) => {
	if (def.multi) return [];
	if (def.type === 'number') return 0;
	if (def.type === 'bool') return false;
	if (def.type === 'json') return null;
	return '';
};

const tokenize = (src) => {
	const tokens = [];
	let i = 0;
	while (i < src.length) {
		const c = src[i];
		if (/\s/.test(c)) {
			i++;
		} else if (c === '(' || c === ')') {
			tokens.push({ t: c });
			i++;
		} else if (src.startsWith('&&', i) || src.startsWith('||', i)) {
			tokens.push({ t: src.slice(i, i + 2) });
			i += 2;
		} else if (/[!<>=~?]/.test(c)) {
			const m = /^(\?)?(!=|>=|<=|!~|=|>|<|~)/.exec(src.slice(i));
			if (!m) throw new ClientResponseError(400, `Filtro non valido: ${src}`);
			tokens.push({ t: 'op', v: m[2] });
			i += m[0].length;
		} else if (c === '"' || c === "'") {
			let j = i + 1;
			let out = '';
			while (j < src.length && src[j] !== c) {
				if (src[j] === '\\' && j + 1 < src.length) j++;
				out += src[j++];
			}
			tokens.push({ t: 'val', v: out });
			i = j + 1;
		} else {
			const m = /^[^\s()!<>=~?&|]+/.exec(src.slice(i));
			const word = m[0];
			i += word.length;
			if (/^-?\d+(\.\d+)?$/.test(word)) tokens.push({ t: 'val', v: Number(word) });
			else if (word === 'true' || word === 'false') tokens.push({ t: 'val', v: word === 'true' });
			else if (word === 'null') tokens.push({ t: 'val', v: '' });
			else tokens.push({ t: 'id', v: word });
		}
	}
	return tokens;
};

const compileFilter = (src) => {
	if (!src || !String(src).trim()) return () => true;
	const tokens = tokenize(String(src));
	let pos = 0;
	const peek = () => tokens[pos];
	const next = () => tokens[pos++];

	const operand = () => {
		const tok = next();
		if (!tok) throw new ClientResponseError(400, `Filtro non valido: ${src}`);
		if (tok.t === 'val') return () => tok.v;
		if (tok.t === 'id') {
			const path = tok.v.split('.');
			return (rec, ctx) => {
				if (path[0] === '@request' && path[1] === 'auth') return ctx.auth ? ctx.auth[path[2]] ?? '' : '';
				let cur = rec;
				for (let k = 0; k < path.length; k++) {
					if (cur === null || cur === undefined) return '';
					if (k > 0) {
						const rel = ctx.relationOf(cur, path[k - 1]);
						cur = rel ? rel[path[k]] : cur[path[k]];
					} else {
						cur = cur[path[k]];
					}
				}
				return cur ?? '';
			};
		}
		throw new ClientResponseError(400, `Filtro non valido: ${src}`);
	};

	const compare = (a, op, b) => {
		if (Array.isArray(a)) return op === '!=' ? !a.includes(b) : a.some((x) => compare(x, op, b));
		const numeric = typeof a === 'number' || typeof b === 'number';
		const x = numeric ? Number(a) : String(a ?? '');
		const y = numeric ? Number(b) : String(b ?? '');
		switch (op) {
			case '=':
				return x === y;
			case '!=':
				return x !== y;
			case '>':
				return x > y;
			case '<':
				return x < y;
			case '>=':
				return x >= y;
			case '<=':
				return x <= y;
			case '~':
				return String(a).toLowerCase().includes(String(b).toLowerCase());
			case '!~':
				return !String(a).toLowerCase().includes(String(b).toLowerCase());
			default:
				return false;
		}
	};

	const primary = () => {
		if (peek()?.t === '(') {
			next();
			const e = orExpr();
			if (next()?.t !== ')') throw new ClientResponseError(400, `Filtro non valido: ${src}`);
			return e;
		}
		const left = operand();
		const opTok = next();
		if (!opTok || opTok.t !== 'op') throw new ClientResponseError(400, `Filtro non valido: ${src}`);
		const right = operand();
		return (rec, ctx) => compare(left(rec, ctx), opTok.v, right(rec, ctx));
	};

	const andExpr = () => {
		let e = primary();
		while (peek()?.t === '&&') {
			next();
			const l = e;
			const r = primary();
			e = (rec, ctx) => l(rec, ctx) && r(rec, ctx);
		}
		return e;
	};

	const orExpr = () => {
		let e = andExpr();
		while (peek()?.t === '||') {
			next();
			const l = e;
			const r = andExpr();
			e = (rec, ctx) => l(rec, ctx) || r(rec, ctx);
		}
		return e;
	};

	const fn = orExpr();
	if (pos < tokens.length) throw new ClientResponseError(400, `Filtro non valido: ${src}`);
	return fn;
};

const compareValues = (a, b) => {
	if (typeof a === 'number' && typeof b === 'number') return a - b;
	return String(a ?? '').localeCompare(String(b ?? ''), 'it', { numeric: true, sensitivity: 'base' });
};

const sortRecords = (list, sort) => {
	if (!sort) return list;
	const keys = String(sort)
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s) => (s.startsWith('-') ? { f: s.slice(1), dir: -1 } : { f: s.replace(/^\+/, ''), dir: 1 }));
	return [...list].sort((a, b) => {
		for (const { f, dir } of keys) {
			const c = compareValues(a[f], b[f]);
			if (c !== 0) return c * dir;
		}
		return 0;
	});
};

const findRecord = (collection, id) => (db()[collection] || []).find((r) => r.id === id);

const relationOf = (collectionName) => (rec, field) => {
	const def = schema[collectionName]?.[field];
	if (!def || def.type !== 'relation') return null;
	const v = rec[field];
	return findRecord(def.collection, Array.isArray(v) ? v[0] : v) || null;
};

const publicRecord = (collectionName, rec) => {
	const out = { ...rec, collectionName, collectionId: collectionName };
	if (collectionName === 'users') {
		delete out.password;
	}
	return JSON.parse(JSON.stringify(out));
};

const applyExpand = (collectionName, rec, expand) => {
	if (!expand) return rec;
	const groups = {};
	String(expand)
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.forEach((path) => {
			const [head, ...rest] = path.split('.');
			groups[head] = groups[head] || [];
			if (rest.length) groups[head].push(rest.join('.'));
		});
	const ex = {};
	for (const [field, nested] of Object.entries(groups)) {
		const def = schema[collectionName]?.[field];
		if (!def || def.type !== 'relation') continue;
		const ids = Array.isArray(rec[field]) ? rec[field] : rec[field] ? [rec[field]] : [];
		const found = ids
			.map((id) => findRecord(def.collection, id))
			.filter(Boolean)
			.map((r) => applyExpand(def.collection, publicRecord(def.collection, r), nested.join(',')));
		if (!found.length) continue;
		ex[field] = def.multi ? found : found[0];
	}
	if (Object.keys(ex).length) rec.expand = ex;
	return rec;
};

const formDataToObject = (body, collectionName, id) => {
	if (!(typeof FormData !== 'undefined' && body instanceof FormData)) return { ...(body || {}) };
	const obj = {};
	for (const [k, v] of body.entries()) {
		if (typeof File !== 'undefined' && v instanceof File) {
			if (!v.name) continue;
			const name = v.name.replace(/[^\w.\-]+/g, '_');
			try {
				fileUrls.set(`${collectionName}/${id}/${name}`, URL.createObjectURL(v));
			} catch {
				fileUrls.set(`${collectionName}/${id}/${name}`, '');
			}
			obj[k] = obj[k] !== undefined ? [].concat(obj[k], name) : name;
		} else {
			obj[k] = obj[k] !== undefined ? [].concat(obj[k], v) : v;
		}
	}
	return obj;
};

const wait = () => new Promise((r) => setTimeout(r, 60));

const authListeners = new Set();

const readAuth = () => {
	try {
		const raw = safeStorage.get(AUTH_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const authStore = {
	token: '',
	record: null,
	get model() {
		return this.record;
	},
	get isValid() {
		return !!this.record;
	},
	get isSuperuser() {
		return false;
	},
	save(token, record) {
		this.token = token;
		this.record = record;
		if (record) safeStorage.set(AUTH_KEY, JSON.stringify({ token, id: record.id }));
		else safeStorage.remove(AUTH_KEY);
		authListeners.forEach((cb) => cb(token, record));
	},
	clear() {
		this.save('', null);
	},
	onChange(cb, fireImmediately = false) {
		authListeners.add(cb);
		if (fireImmediately) cb(this.token, this.record);
		return () => authListeners.delete(cb);
	},
};

const saved = readAuth();
if (saved?.id) {
	const u = findRecord('users', saved.id);
	if (u) {
		authStore.token = saved.token;
		authStore.record = publicRecord('users', u);
	}
}

const ctx = (collectionName) => ({ auth: authStore.record, relationOf: relationOf(collectionName) });

const ensureCollection = (name) => {
	if (!schema[name]) throw new ClientResponseError(404, `Collezione "${name}" non trovata.`);
	if (!db()[name]) db()[name] = [];
	return db()[name];
};

const deleteCascade = (collectionName, id) => {
	const records = db();
	for (const [other, fields] of Object.entries(schema)) {
		for (const [field, def] of Object.entries(fields)) {
			if (def.type !== 'relation' || def.collection !== collectionName) continue;
			const list = records[other] || [];
			for (const rec of [...list]) {
				const v = rec[field];
				const refs = Array.isArray(v) ? v.includes(id) : v === id;
				if (!refs) continue;
				if (def.cascade) {
					deleteCascade(other, rec.id);
					records[other] = records[other].filter((r) => r.id !== rec.id);
				} else if (def.required && !def.multi) {
					throw new ClientResponseError(400, 'Impossibile eliminare il record: è collegato ad altri dati.');
				} else {
					rec[field] = Array.isArray(v) ? v.filter((x) => x !== id) : '';
				}
			}
		}
	}
};

const collection = (name) => {
	const listFn = (options = {}) => {
		const list = ensureCollection(name);
		const filterFn = compileFilter(options.filter);
		const c = ctx(name);
		const rows = sortRecords(
			list.filter((r) => filterFn(r, c)),
			options.sort,
		);
		return rows.map((r) => applyExpand(name, publicRecord(name, r), options.expand));
	};

	return {
		async getFullList(batchOrOptions, maybeOptions) {
			await wait();
			const options = typeof batchOrOptions === 'object' && batchOrOptions !== null ? batchOrOptions : maybeOptions || {};
			return listFn(options);
		},
		async getList(page = 1, perPage = 30, options = {}) {
			await wait();
			const all = listFn(options);
			const start = (page - 1) * perPage;
			return {
				page,
				perPage,
				totalItems: all.length,
				totalPages: Math.max(1, Math.ceil(all.length / perPage)),
				items: all.slice(start, start + perPage),
			};
		},
		async getFirstListItem(filter, options = {}) {
			await wait();
			const found = listFn({ ...options, filter })[0];
			if (!found) throw new ClientResponseError(404, 'Record non trovato.');
			return found;
		},
		async getOne(id, options = {}) {
			await wait();
			ensureCollection(name);
			const rec = findRecord(name, id);
			if (!rec) throw new ClientResponseError(404, 'Record non trovato.');
			return applyExpand(name, publicRecord(name, rec), options.expand);
		},
		async create(body = {}, options = {}) {
			await wait();
			const list = ensureCollection(name);
			const fields = schema[name];
			const id = (body instanceof Object && !(body instanceof FormData) && body.id) || randomId();
			const input = formDataToObject(body, name, id);
			const rec = { id };
			for (const [f, def] of Object.entries(fields)) {
				if (f === 'id') continue;
				rec[f] = f in input ? coerce(def, input[f]) : emptyValue(def);
			}
			const now = nowPb();
			rec.created = now;
			rec.updated = now;
			if (name === 'users') {
				if (!rec.email) throw new ClientResponseError(400, 'Email obbligatoria.');
				if (list.some((u) => u.email === rec.email)) throw new ClientResponseError(400, 'Email già registrata.');
				if (input.password) DEMO_PASSWORDS[rec.email] = input.password;
			}
			list.push(rec);
			persist();
			return applyExpand(name, publicRecord(name, rec), options.expand);
		},
		async update(id, body = {}, options = {}) {
			await wait();
			ensureCollection(name);
			const rec = findRecord(name, id);
			if (!rec) throw new ClientResponseError(404, 'Record non trovato.');
			const fields = schema[name];
			const input = formDataToObject(body, name, id);
			for (const [k, v] of Object.entries(input)) {
				if (k === 'id' || k === 'created' || k === 'updated' || k === 'expand' || k === 'collectionName' || k === 'collectionId') continue;
				if (k.endsWith('+') || k.endsWith('-')) {
					const f = k.slice(0, -1);
					const def = fields[f];
					if (!def) continue;
					const cur = Array.isArray(rec[f]) ? rec[f] : rec[f] ? [rec[f]] : [];
					const vals = [].concat(v);
					rec[f] = k.endsWith('+') ? [...cur, ...vals] : cur.filter((x) => !vals.includes(x));
					continue;
				}
				if (fields[k]) rec[k] = coerce(fields[k], v);
			}
			rec.updated = nowPb();
			persist();
			if (name === 'users' && authStore.record?.id === id) authStore.save(authStore.token, publicRecord('users', rec));
			return applyExpand(name, publicRecord(name, rec), options.expand);
		},
		async delete(id) {
			await wait();
			ensureCollection(name);
			if (!findRecord(name, id)) throw new ClientResponseError(404, 'Record non trovato.');
			deleteCascade(name, id);
			db()[name] = db()[name].filter((r) => r.id !== id);
			persist();
			return true;
		},
		async authWithPassword(identity, password) {
			await wait();
			if (name !== 'users') throw new ClientResponseError(400, 'Autenticazione non disponibile.');
			const email = String(identity || '').trim().toLowerCase();
			const user = db().users.find((u) => u.email.toLowerCase() === email);
			if (!user || DEMO_PASSWORDS[user.email] !== password) {
				throw new ClientResponseError(400, 'Failed to authenticate.');
			}
			const record = publicRecord('users', user);
			const token = `demo.${user.id}.${Date.now()}`;
			authStore.save(token, record);
			return { token, record };
		},
		async authRefresh() {
			if (!authStore.record) throw new ClientResponseError(401, 'Non autenticato.');
			return { token: authStore.token, record: authStore.record };
		},
		async subscribe() {
			return async () => {};
		},
		async unsubscribe() {
			return true;
		},
	};
};

const files = {
	getURL(record, filename) {
		if (!record || !filename) return '';
		const name = record.collectionName || record.collectionId;
		return fileUrls.get(`${name}/${record.id}/${filename}`) || `${import.meta.env.BASE_URL}demo-file.html#${encodeURIComponent(filename)}`;
	},
};
files.getUrl = files.getURL;

export const createDemoClient = () => ({
	isDemo: true,
	resetDemoData,
	baseURL: '',
	authStore,
	files,
	collection,
	autoCancellation() {
		return this;
	},
	cancelAllRequests() {
		return this;
	},
	async health() {
		return { code: 200, message: 'Demo' };
	},
});

export { ClientResponseError };
