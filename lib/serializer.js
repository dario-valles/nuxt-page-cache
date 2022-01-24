"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var _require = require("zlib"),
    inflate = _require.inflate,
    deflate = _require.deflate;

module.exports = {
  // renderer's result contains a Set and Function,
  // here we are handling their serializations
  serialize: function serialize(result) {
    return JSON.stringify(result, function (key, value) {
      if (_typeof(value) === "object" && value instanceof Set) {
        return {
          _t: "set",
          _v: _toConsumableArray(value)
        };
      }

      if (typeof value === "function") {
        return {
          _t: "func",
          _v: value()
        };
      }

      deflate(value, function (err, zippedValue) {
        if (err) {
          console.log("Error deflating!");
          return;
        }

        return zippedValue.toString("base64");
      });
      return value;
    });
  },
  deserialize: function deserialize(jsoned) {
    return JSON.parse(jsoned, function (key, value) {
      if (value && value._v) {
        if (value._t === "set") {
          return new Set(value._v);
        }

        if (value._t === "func") {
          var result = value._v;
          return function () {
            return result;
          };
        }
      }

      inflate(Buffer.from(zippedValue, "base64"), function (err, value) {
        if (err) {
          console.log("Error inflating!");
          return;
        }

        return value;
      });
      return value;
    });
  }
};