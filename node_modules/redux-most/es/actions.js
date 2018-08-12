import { EPIC_BEGIN, EPIC_END } from './constants';

export var epicBegin = function epicBegin() {
  return { type: EPIC_BEGIN };
};

export var epicEnd = function epicEnd() {
  return { type: EPIC_END };
};