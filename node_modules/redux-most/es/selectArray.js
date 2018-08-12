import { filter } from 'most';
import { curry2, findIndex } from '@most/prelude';

export var selectArray = curry2(function (actionTypes, stream) {
  return filter(function (_ref) {
    var type = _ref.type;
    return type && findIndex(type, actionTypes) !== -1;
  }, stream);
});