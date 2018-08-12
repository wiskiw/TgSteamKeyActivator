'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.select = undefined;

var _most = require('most');

var _prelude = require('@most/prelude');

var select = exports.select = (0, _prelude.curry2)(function (actionType, stream) {
  return (0, _most.filter)(function (_ref) {
    var type = _ref.type;
    return type && type === actionType;
  }, stream);
});