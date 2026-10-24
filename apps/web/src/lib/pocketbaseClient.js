import Pocketbase from 'pocketbase';

export const IS_DEMO = import.meta.env.VITE_DEMO === 'true';

const POCKETBASE_API_URL = import.meta.env.VITE_POCKETBASE_URL || '/';

const pocketbaseClient = IS_DEMO
	? (await import('@/demo/demoClient')).createDemoClient()
	: new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;

export { pocketbaseClient };
