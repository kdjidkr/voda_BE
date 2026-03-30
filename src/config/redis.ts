import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

const host = process.env.REDIS_HOST || 'localhost';
const port = Number.parseInt(process.env.REDIS_PORT || '6379', 10);
const password = process.env.REDIS_PASSWORD;

export const redisOptions = {
	host,
	port,
	password,
	maxRetriesPerRequest: null as null,
};

const redisUrl =
	process.env.REDIS_URL ||
	(password ? `redis://:${encodeURIComponent(password)}@${host}:${port}` : `redis://${host}:${port}`);

declare global {
	var redis: Redis | undefined;
}

const createRedisClient = (): Redis => {
	const client = new Redis(redisUrl, {
		maxRetriesPerRequest: redisOptions.maxRetriesPerRequest,
		lazyConnect: true,
	});

	client.on('error', (err: unknown) => {
		console.error('[Infrastructure] Redis Connection Error:', err);
	});

	client.on('connect', () => {
		console.log('[Infrastructure] Redis Connection Success');
	});

	return client;
};

export const redisClient = globalThis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
	globalThis.redis = redisClient;
}

export const connectRedis = async (): Promise<void> => {
	if (redisClient.status === 'ready' || redisClient.status === 'connecting' || redisClient.status === 'connect') {
		return;
	}

	await redisClient.connect();
};

export const disconnectRedis = async (): Promise<void> => {
	if (redisClient.status !== 'end') {
		await redisClient.quit();
	}
};

void connectRedis();

export const REDIS_KEYS = {
	REFRESH_TOKEN: (userId: string) => `refreshToken:${userId}`,
};
