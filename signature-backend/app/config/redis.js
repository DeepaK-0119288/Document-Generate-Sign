// redisInstance.js
import Redis from 'ioredis';

const redisInstance = new Redis({
  host: 'huge-hog-58948.upstash.io',
  port: 6379,
  password: process.env.REDIS_PASSWORD, 
  username: 'default', 
  tls: {}, 
  maxRetriesPerRequest: 20, 
  retryStrategy(times) {
    return Math.min(times * 50, 2000); 
  },
});

// Add error handling
redisInstance.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Optional: Log successful connection
redisInstance.on('connect', () => {
  console.log('Connected to Upstash Redis');
});

export default redisInstance;