import { filter } from 'most';
import { curry2 } from '@most/prelude';

export var select = curry2(function (actionType, stream) {
  return filter(function (_ref) {
    var type = _ref.type;
    return type && type === actionType;
  }, stream);
});