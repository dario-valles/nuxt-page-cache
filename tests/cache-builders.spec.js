const makeCache = require("../lib/cache-builders");

describe("memoryCache", () => {
    it("should return cached result", async () => {
        const cache = makeCache({ type: "memory" });
        cache.setAsync("sample", "data");
        expect(await cache.getAsync("sample")).to.be.eql("data");
    });
});

describe("redisCache", () => {
    it("should return cached result", async () => {
        const cache = makeCache({
            type: "node_redis",
            url: "rediss://:35a9fa39b78a410eb5b7fbcd9fcdc6ec@eu1-tight-raven-34538.upstash.io:34538",
            // host: "eu1-tight-raven-34538.upstash.io",
            // port: "34538",
            // auth_pass: "35a9fa39b78a410eb5b7fbcd9fcdc6ec",
        });
        await cache.setAsync("sample", "data");
        expect(await cache.getAsync("sample")).to.be.eql("data");
    });
        it("should delete cached result", async () => {
            const cache = makeCache({
                type: "node_redis",
                url: "rediss://:35a9fa39b78a410eb5b7fbcd9fcdc6ec@eu1-tight-raven-34538.upstash.io:34538",
                // host: "eu1-tight-raven-34538.upstash.io",
                // port: "34538",
                // auth_pass: "35a9fa39b78a410eb5b7fbcd9fcdc6ec",
            });
            await cache.setAsync("sample", "data");
            await cache.delAsync("sample");
            expect(await cache.getAsync("sample")).to.be.eql(null);
        });

    // it("should configure on initialization", async () => {
    //     const cache = makeCache({
    //         type: "ioredis",
    //         host: "eu1-tight-raven-34538.upstash.io",
    //         port: "34538",
    //         password: "35a9fa39b78a410eb5b7fbcd9fcdc6ec",
    //         prefix: "",
    //         ttl: 10 * 60,
    //         configure: [
    //             ["maxmemory", "200mb"],
    //             ["maxmemory-policy", "allkeys-lru"],
    //         ],
    //     });
    //     expect(await cache.getAsync("sample")).to.be.eql("data");
    // });
});

// describe('memcached', () => {
//   it('should return cached result', async () => {
//     const cache = makeCache({
//       type: 'memcached',
//       options: {
//         hosts: ['127.0.0.1:11211'],
//       },
//     });
//     await cache.setAsync('sample', 'data');
//     expect(await cache.getAsync('sample')).to.be.eql('data');
//   });
// });

// describe('multi', () => {
//   it('memory+memcached should return cached result', async () => {
//     const cache = makeCache({
//       type: 'multi',
//       stores: [
//         {
//           type: 'memory',
//           max: 2000,
//           ttl: 3600
//         },
//         {
//           type: 'memcached',
//           options: {
//             hosts: ['127.0.0.1:11211']
//           }
//         }
//       ]
//     });
//     await cache.setAsync('sample', 'data');
//     expect(await cache.getAsync('sample')).to.be.eql('data');
//   });

//   it('memory+redis should return cached result', async () => {
//     const cache = makeCache({
//       type: 'multi',
//       stores: [
//         {
//           type: 'memory',
//           max: 2000,
//           ttl: 3600
//         },
//         {
//           type: 'redis',
//           host: 'localhost'
//         }
//       ]
//     });
//     await cache.setAsync('sample', 'data');
//     expect(await cache.getAsync('sample')).to.be.eql('data');
//   });
// });

// describe('ioredisCache', () => {
//     it('should return cached result', async () => {
//         const cache = makeCache({
//             type: 'ioredis',
//             host: process.env.CACHE_HOST || 'redis'
//         });
//         cache.setAsync('sample', 'data');
//         expect(await cache.getAsync('sample')).to.be.eql('data');
//     });
// });
