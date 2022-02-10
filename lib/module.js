"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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

module.exports = /*#__PURE__*/function () {
  var _pageCache = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_nuxt, _options) {
    var isNuxtModule,
        nuxt,
        config,
        isCacheFriendly,
        defaultCacheKeyBuilder,
        buildCacheKey,
        cacheStatusHeader,
        setHeaderFunc,
        currentVersion,
        purgeQueryParam,
        purgeSecret,
        variant,
        cache,
        renderer,
        renderRoute,
        _args = arguments;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            buildCacheKey = function _buildCacheKey2(route, context) {
              if (!isCacheFriendly(route, context)) return {
                key: null
              };
              var keyConfig = (config.key || defaultCacheKeyBuilder)(route, context);
              return {
                key: _typeof(keyConfig) === 'object' ? keyConfig.key : keyConfig,
                ttl: _typeof(keyConfig) === 'object' ? keyConfig.ttl : config.store.ttl
              };
            };

            defaultCacheKeyBuilder = function _defaultCacheKeyBuild(route, context) {
              var hostname = context.req && context.req.hostname || context.req && context.req.host || context.req && context.req.headers && context.req.headers.host;
              if (!hostname) return;
              var cacheKey = config.useHostPrefix === true && hostname ? path.join(hostname, route) : route;
              return cacheKey;
            };

            isCacheFriendly = function _isCacheFriendly(path, context) {
              if (typeof config.isCacheable === 'function') {
                return config.isCacheable(path, context);
              }

              return !context.res.spa && config.pages.some(function (pat) {
                return pat instanceof RegExp ? pat.test(path) : path.startsWith(pat);
              });
            };

            // used as a nuxt module, only config is provided as argument
            // and nuxt instance will be provided as this context
            isNuxtModule = _args.length < 2 && this.nuxt;
            nuxt = isNuxtModule ? this.nuxt : _nuxt;
            config = isNuxtModule ? Object.assign({}, this.options && this.options.cache, _nuxt) : _options;

            if (!(config.enabled === false || !nuxt || !nuxt.renderer)) {
              _context.next = 8;
              break;
            }

            return _context.abrupt("return");

          case 8:
            if (!(!Object.keys(config) || !Array.isArray(config.pages) || !config.pages.length)) {
              _context.next = 11;
              break;
            }

            console.warn('nuxt-page-cache\'s configuration is missing.');
            return _context.abrupt("return");

          case 11:
            cacheStatusHeader = typeof config.cacheStatusHeader === 'string' && config.cacheStatusHeader;
            setHeaderFunc = typeof config.setHeaderFunc === 'string' ? config.setHeaderFunc : 'setHeader';
            currentVersion = config.version || this.options && this.options.version;
            purgeQueryParam = config.purgeQueryParam || this.options && this.options.purgeQueryParam;
            purgeSecret = config.purgeSecret || this.options && this.options.purgeSecret;
            variant = config.variant || this.options && this.options.variant;
            cache = makeCache(config.store);
            cleanIfNewVersion(cache, currentVersion);
            renderer = nuxt.renderer;
            renderRoute = renderer.renderRoute.bind(renderer);

            renderer.renderRoute = function (route, context) {
              var _buildCacheKey = buildCacheKey(route, context),
                  cacheKey = _buildCacheKey.key,
                  ttl = _buildCacheKey.ttl; // purge cache if requested


              if (purgeQueryParam && purgeSecret) {
                var query = new RegExp("".concat(purgeQueryParam, "=([^&]*)"));
                var url = context.req.url;
                var matches = url.match(query);
                console.log({
                  matches: matches
                });

                if (matches) {
                  var canPurge = matches[1] === purgeSecret;
                  cacheKey = cacheKey.replace(query, "").replace(/\?&/, "?");

                  if (cacheKey.lastIndexOf('?') !== -1) {
                    cacheKey = cacheKey.substring(0, -1);
                  }

                  if (canPurge) {
                    console.log({
                      canPurge: canPurge
                    });
                    setHeader(cacheStatusHeader, "PURGED");

                    if (variant) {
                      var varianReqExp = new RegExp("".concat(variant, "*/"));
                      return cache.keysAsync(cacheKey.replace(varianReqExp, "")).then(function (keys) {
                        console.log({
                          keys: keys
                        });
                        cache.delAsync(keys).then(function () {
                          return renderRoute(route, context);
                        });
                      });
                    }

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

            return _context.abrupt("return", cache);

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function pageCache(_x, _x2) {
    return _pageCache.apply(this, arguments);
  }

  return pageCache;
}();