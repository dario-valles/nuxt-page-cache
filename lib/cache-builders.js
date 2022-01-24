"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Promise = require("bluebird");

var cacheManager = require("cache-manager");

function memoryCache(config) {
  return cacheManager.caching(_objectSpread({
    store: "memory"
  }, config));
}

function redisCache(config) {
  var Redis = require("ioredis");

  var client = new Redis(_objectSpread({
    retry_strategy: function retry_strategy() {}
  }, config));
  return cacheManager.caching(_objectSpread({
    store: client,
    retry_strategy: function retry_strategy() {}
  }, config));
}

function memcachedCache(config) {
  return cacheManager.caching(_objectSpread({
    store: require("cache-manager-memcached-store")
  }, config));
}

function multiCache(config) {
  var stores = config.stores.map(makeCache);
  return cacheManager.multiCaching(stores);
}

function ioredisCache(config) {
  return cacheManager.caching(_objectSpread({
    store: require("cache-manager-ioredis")
  }, config));
}

var cacheBuilders = {
  memory: memoryCache,
  multi: multiCache,
  redis: redisCache,
  memcached: memcachedCache,
  ioredis: ioredisCache
};

function makeCache() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    type: "memory"
  };
  var builder = cacheBuilders[config.type];

  if (!builder) {
    throw new Error("Unknown store type: " + config.type);
  }

  return Promise.promisifyAll(builder(config));
}

module.exports = makeCache;