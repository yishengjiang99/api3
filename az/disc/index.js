"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = exports.uploadFile = exports.getContainerClient = exports.getServiceClient = void 0;
var storage_blob_1 = require("@azure/storage-blob");
var path_1 = require("path");
var abort_controller_1 = require("@azure/abort-controller");
var ls = require("shelljs").ls;
var uuidv1 = require("uuid/v1");
var ttw = require("tty").WriteStream;
var ttr = require("tty").ReadStream;
var SigTrap = new abort_controller_1.AbortController();
process.on("SIGINT", function () {
    SigTrap.abort();
});
exports.getServiceClient = function () { return __awaiter(void 0, void 0, void 0, function () {
    var AZURE_STORAGE_CONNECTION_STRING, blobServiceClient;
    return __generator(this, function (_a) {
        AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!AZURE_STORAGE_CONNECTION_STRING) {
            console.log("process.env.AZURE_STORAGE_CONNECTION_STRING not found ");
            process.exit(1);
        }
        blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        return [2 /*return*/, blobServiceClient];
    });
}); };
exports.getContainerClient = function (containerName) {
    if (containerName === void 0) { containerName = "cdn"; }
    return __awaiter(void 0, void 0, void 0, function () {
        var blobServiceClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Azure Blob storage v12 - JavaScript quickstart sample");
                    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) return [3 /*break*/, 2];
                    blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
                    return [4 /*yield*/, blobServiceClient.getContainerClient(containerName)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    console.error("process.env.AZURE_STORAGE_CONNECTION_STRING not set");
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
};
function uploadFile(path) {
    return __awaiter(this, void 0, void 0, function () {
        var client, blobName, blockBlobClient, resp, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.getContainerClient()];
                case 1:
                    client = _a.sent();
                    if (!client)
                        throw Error("no ContainerClient");
                    blobName = uuidv1 + "-" + path_1.basename(path);
                    blockBlobClient = client.getBlockBlobClient(blobName);
                    ttw.write("starting upload of " + path);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, blockBlobClient.uploadFile(path, {
                            onProgress: ttw.write("-"),
                            abortSignal: SigTrap.signal,
                            concurrency: 5,
                        })];
                case 3:
                    resp = _a.sent();
                    return [2 /*return*/, resp];
                case 4:
                    e_1 = _a.sent();
                    throw e_1;
                case 5: return [2 /*return*/, null];
            }
        });
    });
}
exports.uploadFile = uploadFile;
function main(argv2) {
    return __awaiter(this, void 0, void 0, function () {
        var filepath;
        var _this = this;
        return __generator(this, function (_a) {
            filepath = process.argv[2] || argv2;
            if (!filepath) {
                console.info("Usage: upload [filepath]");
                return [2 /*return*/];
            }
            ls(filepath, ["-l"])
                .map(function (file) {
                console.log(file);
                return file;
            })
                .reduce(function (uploaded, previousPromise, file) { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _b = (_a = uploaded).push;
                            return [4 /*yield*/, previousPromise];
                        case 1:
                            _b.apply(_a, [_c.sent()]);
                            return [2 /*return*/, uploadFile(file)];
                    }
                });
            }); }, Promise.resolve(null));
            return [2 /*return*/];
        });
    });
}
exports.main = main;
