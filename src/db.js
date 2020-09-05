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
exports.__esModule = true;
exports.queryYt = exports.queryYtWithDb = exports.insertYtResp = exports.insertVid = exports.userFiles = exports.hashCheckAuthLogin = exports.getOrCreateUser = exports.genUserName = exports.dbMeta = exports.dbInsert = exports.dbUpsert = exports.dbRow = exports.dbQuery = void 0;
var promise_1 = require("mysql2/promise");
var axios_1 = require("axios");
// let pool = createPool({
//   host: "localhost",
//   user: process.env.db_user,
//   password: process.env.db_password,
//   database: "grepawk",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });
function conn() {
    return __awaiter(this, void 0, promise_1.Connection, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promise_1.createConnection({
                        host: "localhost",
                        user: process.env.db_user,
                        password: process.env.db_password,
                        database: "grepawk",
                        port: 3307
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function dbQuery(sql, args) {
    if (args === void 0) { args = []; }
    return __awaiter(this, void 0, void 0, function () {
        var c, _a, results, fields;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, conn()];
                case 1:
                    c = _b.sent();
                    return [4 /*yield*/, c
                            .query(sql, args)["catch"](function (e) {
                            console.error(sql, args, e);
                        })["finally"](function () { return c.close(); })];
                case 2:
                    _a = _b.sent(), results = _a[0], fields = _a[1];
                    //  c.close();
                    return [2 /*return*/, results];
            }
        });
    });
}
exports.dbQuery = dbQuery;
function dbRow(sql, args) {
    if (args === void 0) { args = []; }
    return __awaiter(this, void 0, void 0, function () {
        var results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dbQuery(sql, args)];
                case 1:
                    results = _a.sent();
                    if (results[0])
                        return [2 /*return*/, results[0]];
                    else
                        return [2 /*return*/, false];
                    return [2 /*return*/];
            }
        });
    });
}
exports.dbRow = dbRow;
function dbUpsert(table, obj, uniqueKeys) {
    return __awaiter(this, void 0, void 0, function () {
        var sql, insertId, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sql = "insert into " + table + " (" + Object.keys(obj).join(",") + ")\n  values (" + Object.values(obj)
                        .map(function (v) { return "'" + v + "'"; })
                        .join(",") + ") \n  on duplicate key update " + Object.keys(obj)
                        .filter(function (k) { return uniqueKeys.indexOf(k) < 0; })
                        .map(function (k) {
                        return " " + k + "='" + obj[k] + "' ";
                    })
                        .join(",");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, dbQuery(sql)];
                case 2:
                    insertId = (_a.sent()).insertId;
                    return [2 /*return*/, insertId];
                case 3:
                    e_1 = _a.sent();
                    console.error(e_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.dbUpsert = dbUpsert;
function dbInsert(table, obj) {
    return __awaiter(this, void 0, void 0, function () {
        var sql, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sql = "insert into " + table + " (" + Object.keys(obj).join(",") + ")\n  values (" + Object.values(obj)
                        .map(function (v) { return "'" + v + "'"; })
                        .join(",") + ")";
                    return [4 /*yield*/, dbQuery(sql)["catch"](function (err) { return console.error(err); })];
                case 1:
                    result = _a.sent();
                    console.log(result);
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.dbInsert = dbInsert;
function dbMeta(name) {
    if (name === void 0) { name = ""; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (name !== "")
                return [2 /*return*/, dbQuery("desc ?", [name])]; //.catch(console.error);
            return [2 /*return*/, dbQuery("show tables", [])];
        });
    });
}
exports.dbMeta = dbMeta;
exports.genUserName = function () {
    require("fs")
        .readSync("usernames.txt")
        .toString()
        .split("\n")
        .map(function (n) { return n.trim(); })
        .map(function (name) {
        return require("./src/db").dbInsert("available_usernames", {
            username: name,
            taken: 0
        });
    });
};
function getOrCreateUser(username) {
    return __awaiter(this, void 0, void 0, function () {
        var user, newuser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dbRow("SELECT * from user where username = ? limit 1", [
                        username,
                    ])];
                case 1:
                    user = _a.sent();
                    if (!!user) return [3 /*break*/, 5];
                    return [4 /*yield*/, dbRow("select username from available_usernames where taken=0 limit 1")];
                case 2:
                    newuser = _a.sent();
                    return [4 /*yield*/, dbQuery("update available_usernames set taken=1 where username=?", [
                            newuser.username,
                        ])];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, dbInsert("user", {
                            username: newuser.username
                        })];
                case 4:
                    user = _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/, user];
            }
        });
    });
}
exports.getOrCreateUser = getOrCreateUser;
exports.hashCheckAuthLogin = function (username) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, require("exec").exec("md5 -s '" + username + (process.env.secret_md5_salt || "welcome") + "'", function (err, stdout, stderr) {
                if (err)
                    throw err;
                return stdout.toString();
            })];
    });
}); };
exports.userFiles = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, dbQuery("select f.*, m.meta as meta \nfrom user u \n  left join files f on u.id=f.user_id \n  left join file_meta m on f.id=m.file_id\n  where u.id=?", [user.id])["catch"](function (e) {
                    console.error(e);
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.insertVid = function (id, title, description) {
    dbInsert("ytvid", {
        title: title,
        id: id,
        description: description
    })
        .then(console.log)["catch"](console.error);
};
exports.insertYtResp = function (items) {
    items.forEach(function (item) {
        return exports.insertVid(item.id.videoId, item.snippet.title, item.snippet.description);
    });
};
function queryYtWithDb(query, cb) { }
exports.queryYtWithDb = queryYtWithDb;
exports.queryYt = function (query, count, cb) {
    var youtube_api_key = process.env.google_key;
    var url = "https://www.googleapis.com/youtube/v3/search?type=video" +
        ("&part=snippet&maxResults=" + count + "&q=" + query + "&key=" + youtube_api_key);
    axios_1["default"].get(url)
        .then(function (resp) {
        return resp.data.items;
    })
        .then(function (items) {
        cb && cb(items);
        exports.insertYtResp(items);
    })["catch"](function (err) {
        console.error(err);
        return [];
    });
};
//export default reactRuntime;
