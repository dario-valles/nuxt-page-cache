"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Promise = require('bluebird');

var cacheManager = require('cache-manager');

function memoryCache(config) {
  return cacheManager.caching(_objectSpread({
    store: 'memory'
  }, config));
}

function redisCache(config) {
  if (config && Array.isArray(config.configure)) {
    var redis = require('redis');

    var client = redis.createClient(_objectSpread({
      retry_strategy: function retry_strategy() {}
    }, config));
    Promise.all(config.configure.map(function (options) {
      return new Promise(function (resolve, reject) {
        client.config.apply(client, ['SET'].concat(_toConsumableArray(options), [function (err, result) {
          if (err || result !== 'OK') {
            reject(err);
          } else {
            resolve(result);
          }
        }]));
      });
    })).then(function () {
      return client.quit();
    });
  }

  return cacheManager.caching(_objectSpread({
    store: require('cache-manager-redis'),
    retry_strategy: function retry_strategy() {}
  }, config));
}

function memcachedCache(config) {
  return cacheManager.caching(_objectSpread({
    store: require('cache-manager-memcached-store')
  }, config));
}

function multiCache(config) {
  var stores = config.stores.map(makeCache);
  return cacheManager.multiCaching(stores);
}

function ioredisCache(config) {
  return cacheManager.caching(_objectSpread({
    store: require('cache-manager-ioredis')
  }, config));
}

function nodeRedis(config) {
  var redisStore = require("cache-manager-redis-store");

  return cacheManager.caching(_objectSpread({
    store: redisStore
  }, config));
}

var cacheBuilders = {
  memory: memoryCache,
  multi: multiCache,
  redis: redisCache,
  memcached: memcachedCache,
  ioredis: ioredisCache,
  node_redis: nodeRedis
};

function makeCache() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    type: 'memory'
  };
  var builder = cacheBuilders[config.type];

  if (!builder) {
    throw new Error('Unknown store type: ' + config.type);
  }

  return Promise.promisifyAll(builder(config));
}

module.exports = makeCache;