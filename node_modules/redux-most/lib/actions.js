'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.epicEnd = exports.epicBegin = undefined;

var _constants = require('./constants');

var epicBegin = exports.epicBegin = function epicBegin() {
  return { type: _constants.EPIC_BEGIN };
};

var epicEnd = exports.epicEnd = function epicEnd() {
  return { type: _constants.EPIC_END };
};