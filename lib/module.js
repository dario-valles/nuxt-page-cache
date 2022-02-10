"use strict";

function _readOnlyError(name) { throw new TypeError("\"" + name + "\" is read-only"); }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var path = require('path');

var _require = require('./serializer'),
    serialize = _require.serialize,
    deserialize = _require.deserialize;

var makeCache = require('./cache-builders');

function cleanIfNewVersion(cache, version) {
  if (!version) return;
  return cache.getAsync('appVersion').then(function (oldVersion) {
    if (oldVersion !== version) {
      console.log("Cache updated from ".concat(oldVersion, " to ").concat(version));
      return cache.resetAsync(); // unfortunately multi cache doesn't return a promise
      // and we can't await for it so as to store new version
      // immediately after reset.
    }
  });
}

function tryStoreVersion(cache, version) {
  console.log('try store version', !version || cache.versionSaved);
  if (!version || cache.versionSaved) return;
  return cache.setAsync('appVersion', version, {
    ttl: null
  }).then(function () {
    cache.versionSaved = true;
  });
}

module.exports = function pageCache(_nuxt, _options) {
  // used as a nuxt module, only config is provided as argument
  // and nuxt instance will be provided as this context
  var isNuxtModule = arguments.length < 2 && this.nuxt;
  var nuxt = isNuxtModule ? this.nuxt : _nuxt;
  var config = isNuxtModule ? Object.assign({}, this.options && this.options.cache, _nuxt) : _options;

  if (config.enabled === false || !nuxt || !nuxt.renderer) {
    return;
  }

  if (!Object.keys(config) || !Array.isArray(config.pages) || !config.pages.length) {
    console.warn('nuxt-page-cache\'s configuration is missing.');
    return;
  }

  function isCacheFriendly(path, context) {
    if (typeof config.isCacheable === 'function') {
      return config.isCacheable(path, context);
    }

    return !context.res.spa && config.pages.some(function (pat) {
      return pat instanceof RegExp ? pat.test(path) : path.startsWith(pat);
    });
  }

  function defaultCacheKeyBuilder(route, context) {
    var hostname = context.req && context.req.hostname || context.req && context.req.host || context.req && context.req.headers && context.req.headers.host;
    if (!hostname) return;
    var cacheKey = config.useHostPrefix === true && hostname ? path.join(hostname, route) : route;
    return cacheKey;
  }

  function buildCacheKey(route, context) {
    if (!isCacheFriendly(route, context)) return {
      key: null
    };
    var keyConfig = (config.key || defaultCacheKeyBuilder)(route, context);
    return {
      key: _typeof(keyConfig) === 'object' ? keyConfig.key : keyConfig,
      ttl: _typeof(keyConfig) === 'object' ? keyConfig.ttl : config.store.ttl
    };
  }

  var cacheStatusHeader = typeof config.cacheStatusHeader === 'string' && config.cacheStatusHeader;
  var setHeaderFunc = typeof config.setHeaderFunc === 'string' ? config.setHeaderFunc : 'setHeader';
  var currentVersion = config.version || this.options && this.options.version;
  var purgeQueryParam = config.purgeQueryParam || this.options && this.options.purgeQueryParam;
  var purgeSecret = config.purgeSecret || this.options && this.options.purgeSecret;
  var cache = makeCache(config.store);
  cleanIfNewVersion(cache, currentVersion);
  var renderer = nuxt.renderer;
  var renderRoute = renderer.renderRoute.bind(renderer);

  renderer.renderRoute = function (route, context) {
    console.log({
      purgeQueryParam: purgeQueryParam
    }, {
      purgeSecret: purgeSecret
    }); // purge cache if requested

    if (purgeQueryParam && purgeSecret) {
      var query = new RegExp("".concat(purgeParam, "=([^&]*)"));
      var url = context.req.url;
      var matches = url.match(query);
      console.log({
        matches: matches
      });

      if (matches) {
        var canPurge = matches[1] === purgeSecret;
        cacheKey.replace(query, "").replace(/\?&/, "?"), _readOnlyError("cacheKey");

        if (canPurge) {
          console.log({
            canPurge: canPurge
          });
          setHeader(cacheStatusHeader, "PURGED");

          if (variant) {
            var varianReqExp = new RegExp("".concat(variant, "*/"));
            cache.keysAsync(cacheKey.replace(varianReqExp, "")), _readOnlyError("cacheKey");
          }

          console.log({
            cacheKey: cacheKey
          });
          return cache.delAsync(cacheKey).then(function () {
            return renderRoute(route, context);
          });
        }
      }
    } // hopefully cache reset is finished up to this point.


    tryStoreVersion(cache, currentVersion);

    function setHeader(name, value) {
      if (name && typeof context.res[setHeaderFunc] === 'function') {
        context.res[setHeaderFunc](name, value);
      }
    }

    var _buildCacheKey = buildCacheKey(route, context),
        cacheKey = _buildCacheKey.key,
        ttl = _buildCacheKey.ttl;

    if (!cacheKey || !renderer.renderer.isReady) {
      setHeader(cacheStatusHeader, 'NONE');
      return renderRoute(route, context);
    }

    function renderSetCache() {
      return renderRoute(route, context).then(function (result) {
        setHeader(cacheStatusHeader, 'MISS');

        if (!result.error && !result.redirected) {
          console.time('setCache');
          cache.setAsync(cacheKey, serialize(result), {
            ttl: ttl
          });
          console.timeEnd('setCache');
        }

        return result;
      });
    }

    return cache.getAsync(cacheKey).then(function (cachedResult) {
      if (cachedResult) {
        setHeader(cacheStatusHeader, "HIT");
        return deserialize(cachedResult);
      }

      return renderSetCache();
    })["catch"](renderSetCache);
  };

  return cache;
};