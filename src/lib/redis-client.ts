import 'server-only'
import { Redis as UpstashRedis } from "@upstash/redis"

type IORedis = any;
type RedisClient = UpstashRedis | IORedis;

const kvType = process.env.KV_CLIENT_TYPE || 'upstash'; // upstash

class KVClientProxy {
    private client: RedisClient;
    private clientInitialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {
        this.initializeClient();
    }

    private async initializeClient(): Promise<void> {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            if (this.clientInitialized) return;

            try {
                if (kvType === 'upstash') {
                    this.client = new UpstashRedis({
                        url: process.env.KV_REST_API_URL,
                        token: process.env.KV_REST_API_TOKEN,
                    });
                } else {
                    const { default: IORedis } = await import('ioredis');
                    this.client = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
                }

                this.clientInitialized = true;
            } catch (error) {
                this.initializationPromise = null;
                throw error;
            }
        })();

        return this.initializationPromise;
    }

    private async ensureClient() {
        if (!this.clientInitialized) {
            await this.initializeClient();
        }
    }

    async setKeyWithExpiry(key: string, value: string, expirySeconds: number) {
        await this.ensureClient();
        if (kvType === 'upstash') {
            await (this.client as UpstashRedis).set(key, value, { px: expirySeconds * 1000 });
        } else {
            await (this.client as IORedis).set(key, value, 'PX', expirySeconds * 1000);
        }
    }

    async getKey(key: string) {
        await this.ensureClient();
        return await this.client.get(key);
    }

    async deleteKey(key: string) {
        await this.ensureClient();
        await this.client.del(key);
    }

    async incr(key: string) {
        await this.ensureClient();
        return await this.client.incr(key);
    }

    async expectKey(key: string, value: string) {
        await this.ensureClient();
        const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
        if (kvType === 'upstash') {
            await (this.client as UpstashRedis).set(key, value, { ex: ONE_WEEK_IN_SECONDS });
        } else {
            await (this.client as IORedis).set(key, value, 'EX', ONE_WEEK_IN_SECONDS);
        }
    }

    async loadScript(luaScript: string) {
        await this.ensureClient();
        if (kvType === 'upstash') {
            const script = await (this.client as UpstashRedis).scriptLoad(luaScript);
            console.log('Script loaded with SHA:', script);
            return script;
        } else {
            const script = await (this.client as IORedis).script('LOAD', luaScript);
            console.log('Script loaded with SHA:', script);
            return script as string;
        }
    }

    async hmset(key: string, value: { [key: string]: number | string }) {
        await this.ensureClient();
        if (kvType === 'upstash') {
            await (this.client as UpstashRedis).hset(key, value);
        } else {
            await (this.client as IORedis).hmset(key, value);
        }
    }

    async zadd(key: string, score: { score: number, member: string | number }) {
        return await this.client.zadd(key, score.score, score.member);
    }

    async scriptFlush() {
        await this.ensureClient();
        if (kvType === 'upstash') {
            await (this.client as UpstashRedis).scriptFlush();
        } else {
            await (this.client as IORedis).script('FLUSH');
        }
    }

    async set(key: string, value: string) {
        await this.ensureClient();
        await this.client.set(key, value);
    }

    async hgetall<T>(key: string): Promise<T | null> {
        await this.ensureClient();
        const result = await this.client.hgetall(key);
        return result ? result as T : null;
    }

    async hincrby(key: string, field: string, increment: number) {
        await this.ensureClient();
        return await this.client.hincrby(key, field, increment);
    }

}

export const redis = new KVClientProxy();


export const setKeyWithExpiry = (key: string, value: string, expirySeconds: number) =>
    redis.setKeyWithExpiry(key, value, expirySeconds);

export const getKey = (key: string) => redis.getKey(key);
export const deleteKey = (key: string) => redis.deleteKey(key);
export const incr = (key: string) => redis.incr(key);
export const expectKey = (key: string, value: string) => redis.expectKey(key, value);
export const loadScript = (luaScript: string) => redis.loadScript(luaScript);
export const hmset = (key: string, value: { [key: string]: number | string }) => redis.hmset(key, value);
export const zadd = (key: string, score: { score: number, member: string | number }) => redis.zadd(key, score);
export const scriptFlush = () => redis.scriptFlush();
export const set = (key: string, value: string) => redis.set(key, value);
export const hgetall = <T>(key: string): Promise<T | null> => redis.hgetall(key);
export const hincrby = (key: string, field: string, increment: number) => redis.hincrby(key, field, increment);