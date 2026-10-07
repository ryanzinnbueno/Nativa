import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('DB unavailable');return env.DB;}
