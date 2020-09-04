"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({__proto__: []} instanceof Array && function (d, b) {d.__proto__ = b;}) ||
            function (d, b) {for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];};
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() {this.constructor = d;}
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.ParseJson = void 0;
var stream_1 = require("stream");
var listStart = "[";
var listEnd = "]";
var objectStart = "{";
var objectEnd = "}";
var ParseJson = /** @class */ (function (_super) {
    __extends(ParseJson, _super);
    function ParseJson() {
        var _this = _super.call(this) || this;
        _this.stack = ["root", ""]; //start at index 1;
        _this.list = null;
        return _this;
    }
    ParseJson.prototype.pushJsonToParent = function (json) {
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1] += json;
        }
    };
    ParseJson.prototype._transform = function (chunk, encoding, callback) {
        var strinput = chunk.toString();
        for (var i = 0;i < strinput.length;i++) {
            switch (strinput[i]) {
                case listStart:
                    this.stack.push("[");
                    this.list = [];
                    break;
                case objectStart:
                    var newstr = "" + strinput[i];
                    this.stack.push(newstr);
                    break;
                case listEnd:
                    if (this.stack.length === 0) {
                        cb(new Error("json malformed", chunk.toString()))
                    }
                    this.pushJsonToParent(this.list.join(","));
                    this.push(this.stack.pop());

                    this.pushJsonToParent(this.stack.pop());
                    //strinput[i]);
                    // var completeStr = this.stack.pop();
                    // this.emit("data", completeStr);
                    // this.pushJsonToParent(completeStr);
                    break;
                case objectEnd:
                    if (this.stack.length === 0) {
                        this.emit("error", new Error("json malformat" + strinput));
                    }
                    this.pushJsonToParent(strinput[i]);
                    var completeStr = this.stack.pop();
                    this.push(completeStr);
                    this.pushJsonToParent(completeStr);
                    this.list && this.list.push(completeStr);
                    break;
                case ",":
                    this.pushJsonToParent(",");
                    break;
                default:
                    this.pushJsonToParent(strinput[i]);
                    break;
            }
        }
        callback();
    };
    return ParseJson;
}(stream_1.Transform));
exports.ParseJson = ParseJson;
