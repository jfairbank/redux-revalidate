import validateReducer from './validateReducer';

export default function validateStore(validate, options) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    const validatedReducer = validateReducer(
      validate,
      options
    )(reducer, preloadedState);

    return createStore(validatedReducer, preloadedState, enhancer);
  };
}
