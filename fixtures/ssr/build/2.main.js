(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[2],{

/***/ "../../lib/index.js":
/*!********************************************************************!*\
  !*** /Users/fox/Desktop/my-github/use-suspense-fetch/lib/index.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

var __spreadArray = this && this.__spreadArray || function (to, from) {
  for (var i = 0, il = from.length, j = to.length; i < il; i++, j++) to[j] = from[i];

  return to;
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSuspenseFetch = exports.peek = exports.preload = exports.refresh = void 0;

var lru_cache_1 = __importDefault(__webpack_require__(/*! lru-cache */ "../../node_modules/lru-cache/index.js"));

var defaultOption = {
  max: 500,
  // 默认一小时, 如果使用 createSuspense 则可以自行修改
  maxAge: 1000 * 60 * 60
};
var globalCache = new lru_cache_1.default(defaultOption);

var handleSuspenseFetch = function (_a) {
  var promiseFn = _a.promiseFn,
      cache = _a.cache,
      args = _a.args,
      _b = _a.preload,
      preload = _b === void 0 ? false : _b,
      _c = _a.lifeSpan,
      lifeSpan = _c === void 0 ? 0 : _c; // 使用 str

  var argsStr = JSON.stringify(args);
  var cachedValue = cache.get(argsStr);

  if (cachedValue) {
    if (preload) return;
    if (cachedValue === null || cachedValue === void 0 ? void 0 : cachedValue.error) throw cachedValue.error;
    if (cachedValue === null || cachedValue === void 0 ? void 0 : cachedValue.response) return cachedValue.response;
    throw cachedValue === null || cachedValue === void 0 ? void 0 : cachedValue.promise;
  }

  var cacheValue = {
    args: args,
    promise: promiseFn.apply(void 0, args).then(function (res) {
      if (res) {
        cacheValue.response = res;
      } else {
        cacheValue.response = true;
      }
    }).catch(function (error) {
      if (error) {
        cacheValue.error = error;
      } else {
        cacheValue.error = 'unknown error';
      }
    }).then(function () {
      if (lifeSpan > 0) {
        setTimeout(function () {
          if (cache.has(argsStr)) {
            cache.del(argsStr);
          }
        }, lifeSpan);
      }
    })
  };
  cache.set(argsStr, cacheValue);
  if (!preload) throw cacheValue.promise;
};
/**
 * 虽然叫 use-xx 但是没有使用任何 hook
 * @param fn
 * @param args
 * @returns
 */


function suspenseFetch(fn) {
  var args = [];

  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i];
  }

  return handleSuspenseFetch({
    promiseFn: fn,
    cache: globalCache,
    args: args,
    lifeSpan: suspenseFetch.lifeSpan
  });
}

exports.default = suspenseFetch; // 设置 lifeSpan

suspenseFetch.lifeSpan = 0; // 设置 ssr, 可以修改此设置，达到 ssr 渲染的目的

suspenseFetch.ssr = false; // 导出去的其他方法，用于全局的缓存, 但是如果是 ssr, 那么在客户端调用 refresh 是没有作用的

function refresh() {
  var args = [];

  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }

  return clearInner.apply(void 0, __spreadArray([globalCache], args));
}

exports.refresh = refresh;

function preload(fn) {
  var args = [];

  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i];
  }

  handleSuspenseFetch({
    promiseFn: fn,
    cache: globalCache,
    args: args,
    preload: true,
    lifeSpan: suspenseFetch.lifeSpan
  });
}

exports.preload = preload;

function peek() {
  var _a;

  var args = [];

  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }

  var argsStr = JSON.stringify(args);
  return (_a = globalCache.get(argsStr)) === null || _a === void 0 ? void 0 : _a.response;
}

exports.peek = peek;

function clearInner(cache) {
  var args = [];

  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i];
  } // 如果不传递第二个参数，则清空所有的缓存


  if (args === undefined || args.length === 0) cache.reset();else {
    var argsStr = JSON.stringify(args);

    if (cache.has(argsStr)) {
      cache.del(argsStr);
    }
  }
}
/**
 * 创建自己的 LRU 缓存，支持配置选项
 * @param lifeSpan 过期时间
 * @param option 配置选项
 * @returns
 */


function createSuspenseFetch(lifeSpan, option) {
  if (lifeSpan === void 0) {
    lifeSpan = 0;
  }

  if (option === void 0) {
    option = {};
  }

  var innerOption = __assign(__assign({}, defaultOption), option);

  var cache = new lru_cache_1.default(innerOption);
  return {
    fetch: function (fn) {
      var args = [];

      for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
      }

      return handleSuspenseFetch({
        promiseFn: fn,
        cache: cache,
        args: args,
        lifeSpan: lifeSpan
      });
    },
    preload: function (fn) {
      var args = [];

      for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
      }

      return void handleSuspenseFetch({
        promiseFn: fn,
        cache: cache,
        args: args,
        preload: true,
        lifeSpan: lifeSpan
      });
    },
    refresh: function () {
      var args = [];

      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }

      return clearInner.apply(void 0, __spreadArray([cache], args));
    },
    peek: function () {
      var _a;

      var args = [];

      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }

      var argsStr = JSON.stringify(args);
      return (_a = cache.get(argsStr)) === null || _a === void 0 ? void 0 : _a.response;
    }
  };
}

exports.createSuspenseFetch = createSuspenseFetch;

/***/ }),

/***/ "./src/Comments2.js":
/*!**************************!*\
  !*** ./src/Comments2.js ***!
  \**************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Comments2; });
/* harmony import */ var _lib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../lib */ "../../lib/index.js");
/* harmony import */ var _lib__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lib__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-dev-runtime */ "./node_modules/react/jsx-dev-runtime.js");
/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_1__);
var _jsxFileName = "/Users/fox/Desktop/my-github/use-suspense-fetch/fixtures/ssr/src/Comments2.js";


var API_DELAY = 2000;
var fakeData = ["Wait, it doesn't wait for React to load?", 'How does this even work?', 'I like marshmallows'];
function Comments2(_ref) {
  var _this = this;

  var subreddit = _ref.subreddit;
  console.log('peek:', Object(_lib__WEBPACK_IMPORTED_MODULE_0__["peek"])(subreddit)); // 会缓存，因为应该记得清楚缓存

  var response = _lib__WEBPACK_IMPORTED_MODULE_0___default()(function () {
    return new Promise(function (resolve) {
      return setTimeout(function () {
        resolve(fakeData);
      }, API_DELAY);
    });
  }, subreddit);
  console.log('post:', response);
  return /*#__PURE__*/Object(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_1__["jsxDEV"])("ul", {
    children: response.map(function (post, i) {
      return /*#__PURE__*/Object(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_1__["jsxDEV"])("li", {
        children: post
      }, i, false, {
        fileName: _jsxFileName,
        lineNumber: 27,
        columnNumber: 9
      }, _this);
    })
  }, void 0, false, {
    fileName: _jsxFileName,
    lineNumber: 25,
    columnNumber: 5
  }, this);
}

/***/ })

}]);
//# sourceMappingURL=2.main.js.map