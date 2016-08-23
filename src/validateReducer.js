import assign from 'object-assign';
import omit from 'lodash.omit';

export default function validateReducer(validate, { errorKey = 'errors' } = {}) {
  return (reducer, preloadedState) =>
    function validatedReducer(state = preloadedState, action) {
      const origResult = reducer(state, action);
      const errors = validate(omit(origResult, errorKey));

      return assign({}, origResult, { [errorKey]: errors });
    };
}
