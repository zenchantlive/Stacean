"use strict";
/**
 * Context7 API Client - Code Execution Pattern
 * Docs: https://context7.com/docs/api-guide
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLibraryId = resolveLibraryId;
exports.queryDocs = queryDocs;
exports.getRecommendedLibraries = getRecommendedLibraries;
var https_1 = __importDefault(require("https"));
var CONTEXT7_API_BASE = 'https://context7.com/api/v1';
// You'll need to set this
var apiKey = process.env.CONTEXT7_API_KEY || '';
function context7Request(path, method, body) {
    if (method === void 0) { method = 'GET'; }
    if (body === void 0) { body = null; }
    return new Promise(function (resolve, reject) {
        var url = new URL(path, CONTEXT7_API_BASE);
        var req = https_1.default.request(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer ".concat(apiKey)
            }
        }, function (res) {
            var data = '';
            res.on('data', function (chunk) { return data += chunk; });
            res.on('end', function () {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(15000, function () { req.destroy(); reject(new Error('timeout')); });
        if (body)
            req.write(JSON.stringify(body));
        req.end();
    });
}
/**
 * Resolve a library name to a Context7 library ID
 */
function resolveLibraryId(libraryName) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, context7Request('/libs/resolve', 'POST', {
                        query: libraryName
                    })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Query documentation for a library
 */
function queryDocs(libraryId, query) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, context7Request('/query', 'POST', {
                        libraryId: libraryId,
                        query: query
                    })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Get recommended libraries for a query
 */
function getRecommendedLibraries(query) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, context7Request('/libs/recommended', 'POST', {
                        query: query
                    })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Example usage
 */
function example() {
    return __awaiter(this, void 0, void 0, function () {
        var libs, docs, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('=== Context7 API Example ===\n');
                    if (!apiKey) {
                        console.log('Set CONTEXT7_API_KEY environment variable first');
                        console.log('Sign up at https://context7.com for a free API key');
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    // Find a library
                    console.log('Finding library...');
                    return [4 /*yield*/, resolveLibraryId('Next.js')];
                case 2:
                    libs = _c.sent();
                    console.log('Library ID:', (_a = libs.libraryIds) === null || _a === void 0 ? void 0 : _a[0]);
                    if (!((_b = libs.libraryIds) === null || _b === void 0 ? void 0 : _b[0])) return [3 /*break*/, 4];
                    // Query docs
                    console.log('\nQuerying docs...');
                    return [4 /*yield*/, queryDocs(libs.libraryIds[0], 'How to set up middleware?')];
                case 3:
                    docs = _c.sent();
                    console.log('Response:', JSON.stringify(docs, null, 2).slice(0, 500));
                    _c.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _c.sent();
                    console.error('Error:', error_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Uncomment to test
// example();
exports.default = {
    resolveLibraryId: resolveLibraryId,
    queryDocs: queryDocs,
    getRecommendedLibraries: getRecommendedLibraries
};
