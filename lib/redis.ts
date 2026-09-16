import Redis from 'ioredis';

// 既存のLiveKit用Redis(同じEC2上、network_mode: hostでlocalhost:6379)を
// usage:プレフィックスの別名前空間として再利用する。
let client: Redis | undefined;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }
  return client;
}
