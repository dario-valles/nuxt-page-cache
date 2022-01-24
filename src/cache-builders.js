const Promise = require("bluebird");
const cacheManager = require("cache-manager");

function memoryCache(config) {
    return cacheManager.caching({
        store: "memory",
        ...config,
    });
}

function redisCache(config) {
    const Redis = require("ioredis");
    const client = new Redis({
        retry_strategy() {},
        ...config,
    });
    return cacheManager.caching({
        store: client,
        retry_strategy() {},
        ...config,
    });
}

function memcachedCache(config) {
    return cacheManager.caching({
        store: require("cache-manager-memcached-store"),
        ...config,
    });
}

function multiCache(config) {
    const stores = config.stores.map(makeCache);
    return cacheManager.multiCaching(stores);
}

function ioredisCache(config) {
    return cacheManager.caching({
        store: require("cache-manager-ioredis"),
        ...config,
    });
}

const cacheBuilders = {
    memory: memoryCache,
    multi: multiCache,
    redis: redisCache,
    memcached: memcachedCache,
    ioredis: ioredisCache,
};

function makeCache(config = { type: "memory" }) {
    const builder = cacheBuilders[config.type];
    if (!builder) {
        throw new Error("Unknown store type: " + config.type);
    }

    return Promise.promisifyAll(builder(config));
}

module.exports = makeCache;
