import test from 'ava';

import {
  combineValidators,
  composeValidators,
  isAlphabetic,
  isNumeric,
  isRequired,
} from 'revalidate';

import { validateReducer } from '../src';

const INITIAL_STATE = {
  favoriteMeme: '',

  dog: {
    name: '',
    age: '',
  },
};

function reducer(state = INITIAL_STATE) {
  return state;
}

const validate = combineValidators({
  'favoriteMeme': isAlphabetic('Favorite Meme'),

  'dog.name': isRequired('Dog Name'),

  'dog.age': composeValidators(
    isRequired,
    isNumeric
  )('Dog Age'),
});

test('validates initial reducer call with no state', t => {
  const validatedReducer = validateReducer(validate)(reducer);
  const result = validatedReducer();

  t.deepEqual(result, {
    ...INITIAL_STATE,
    errors: {
      dog: {
        name: 'Dog Name is required',
        age: 'Dog Age is required',
      },
    },
  });
});

test('validates reducer call with existing state', t => {
  const validatedReducer = validateReducer(validate)(reducer);

  const state = {
    favoriteMeme: '123',

    dog: {
      name: '',
      age: '',
    },
  };

  const result = validatedReducer(state);

  t.deepEqual(result, {
    ...state,

    errors: {
      favoriteMeme: 'Favorite Meme must be alphabetic',

      dog: {
        name: 'Dog Name is required',
        age: 'Dog Age is required',
      },
    },
  });
});

test('valid properties do not result in error messages', t => {
  const validatedReducer = validateReducer(validate)(reducer);

  const state = {
    favoriteMeme: 'Doge',

    dog: {
      name: 'Tucker',
      age: '10',
    },
  };

  const result = validatedReducer(state);

  t.deepEqual(result, {
    ...state,
    errors: { dog: {} },
  });
});

test('some properties can be valid and some not', t => {
  const validatedReducer = validateReducer(validate)(reducer);

  const state = {
    favoriteMeme: 'Doge',

    dog: {
      name: 'Tucker',
      age: 'abc',
    },
  };

  const result = validatedReducer(state);

  t.deepEqual(result, {
    ...state,

    errors: {
      dog: { age: 'Dog Age must be numeric' },
    },
  });
});

test('can have a custom error state key', t => {
  const validatedReducer = validateReducer(
    validate,
    { errorKey: 'myErrors' }
  )(reducer);

  const state = {
    favoriteMeme: '123',

    dog: {
      name: '',
      age: '',
    },
  };

  const result = validatedReducer(state);

  t.deepEqual(result, {
    ...state,

    myErrors: {
      favoriteMeme: 'Favorite Meme must be alphabetic',

      dog: {
        name: 'Dog Name is required',
        age: 'Dog Age is required',
      },
    },
  });
});

test('allows preloading state', t => {
  const preloadedState = {
    favoriteMeme: 'Doge',

    dog: {
      name: 'Tucker',
      age: 'abc',
    },
  };

  const validatedReducer = validateReducer(validate)(reducer, preloadedState);
  const result = validatedReducer();

  t.deepEqual(result, {
    ...preloadedState,

    errors: {
      dog: { age: 'Dog Age must be numeric' },
    },
  });
});
