import test from 'ava';
import thunkMiddleware from 'redux-thunk';

import {
  applyMiddleware,
  compose,
  combineReducers,
  createStore,
} from 'redux';

import {
  combineValidators,
  composeValidators,
  isAlphabetic,
  isNumeric,
  isRequired,
} from 'revalidate';

import { errorsReducer, validateStore } from '../src';

const UPDATE_FAVORITE_MEME = 'UPDATE_FAVORITE_MEME';
const UPDATE_DOG_NAME = 'UPDATE_DOG_NAME';
const UPDATE_DOG_AGE = 'UPDATE_DOG_AGE';

const updateFavoriteMeme = (payload) => ({ payload, type: UPDATE_FAVORITE_MEME });
const updateDogName = (payload) => ({ payload, type: UPDATE_DOG_NAME });
const updateDogAge = (payload) => ({ payload, type: UPDATE_DOG_AGE });

const INITIAL_FAVORITE_MEME = '';

function favoriteMemeReducer(state = INITIAL_FAVORITE_MEME, action) {
  if (action.type === UPDATE_FAVORITE_MEME) {
    return action.payload;
  }

  return state;
}

const INITIAL_DOG = {
  name: '',
  age: '',
};

function dogReducer(state = INITIAL_DOG, action) {
  switch (action.type) {
    case UPDATE_DOG_NAME:
      return { ...state, name: action.payload };

    case UPDATE_DOG_AGE:
      return { ...state, age: action.payload };

    default:
      return state;
  }
}

const INITIAL_STATE = {
  favoriteMeme: INITIAL_FAVORITE_MEME,
  dog: INITIAL_DOG,
};

const validate = combineValidators({
  'favoriteMeme': isAlphabetic('Favorite Meme'),

  'dog.name': isRequired('Dog Name'),

  'dog.age': composeValidators(
    isRequired,
    isNumeric
  )('Dog Age'),
});

function createStoreAndReducer({ errorKey, middleware } = {}) {
  let reducer;
  let enhancer;

  if (errorKey) {
    reducer = combineReducers({
      favoriteMeme: favoriteMemeReducer,
      dog: dogReducer,
      [errorKey]: errorsReducer,
    });

    enhancer = validateStore(validate, { errorKey });
  } else {
    reducer = combineReducers({
      favoriteMeme: favoriteMemeReducer,
      dog: dogReducer,
      errors: errorsReducer,
    });

    enhancer = validateStore(validate);
  }

  if (middleware) {
    return createStore(
      reducer,
      compose(
        enhancer,
        applyMiddleware(...middleware)
      )
    );
  }

  return createStore(reducer, enhancer);
}

test('validates initial store creation', t => {
  const store = createStoreAndReducer();

  t.deepEqual(store.getState(), {
    ...INITIAL_STATE,

    errors: {
      dog: {
        name: 'Dog Name is required',
        age: 'Dog Age is required',
      },
    },
  });
});

test('validates incorrect favoriteMeme', t => {
  const store = createStoreAndReducer();

  store.dispatch(updateFavoriteMeme('123'));

  t.deepEqual(store.getState(), {
    ...INITIAL_STATE,

    favoriteMeme: '123',

    errors: {
      favoriteMeme: 'Favorite Meme must be alphabetic',

      dog: {
        name: 'Dog Name is required',
        age: 'Dog Age is required',
      },
    },
  });
});

test('validates incorrect dog age', t => {
  const store = createStoreAndReducer();

  store.dispatch(updateDogAge('abc'));

  t.deepEqual(store.getState(), {
    ...INITIAL_STATE,

    dog: {
      ...INITIAL_DOG,
      age: 'abc',
    },

    errors: {
      dog: {
        name: 'Dog Name is required',
        age: 'Dog Age must be numeric',
      },
    },
  });
});

test('validates correct properties', t => {
  const validName = 'Tucker';
  const validAge = '10';
  const store = createStoreAndReducer();

  store.dispatch(updateDogName(validName));

  t.deepEqual(store.getState(), {
    ...INITIAL_STATE,

    dog: {
      ...INITIAL_DOG,
      name: validName,
    },

    errors: {
      dog: {
        age: 'Dog Age is required',
      },
    },
  });

  store.dispatch(updateDogAge(validAge));

  t.deepEqual(store.getState(), {
    ...INITIAL_STATE,

    dog: {
      ...INITIAL_DOG,
      name: validName,
      age: validAge,
    },

    errors: { dog: {} },
  });
});

test('cooperates with other middleware', t => {
  function delayUpdateDogName(name, time) {
    return (dispatch) => new Promise(resolve => {
      setTimeout(() => {
        dispatch(updateDogName(name));
        resolve();
      }, time);
    });
  }

  const store = createStoreAndReducer({ middleware: [thunkMiddleware] });

  return store.dispatch(delayUpdateDogName('Tucker', 200)).then(() => {
    t.deepEqual(store.getState(), {
      ...INITIAL_STATE,

      dog: {
        ...INITIAL_DOG,
        name: 'Tucker',
      },

      errors: {
        dog: {
          age: 'Dog Age is required',
        },
      },
    });
  });
});

test('works with custom error keys', t => {
  const errorKey = 'myErrors';
  const store = createStoreAndReducer({ errorKey });

  t.deepEqual(store.getState(), {
    ...INITIAL_STATE,

    [errorKey]: {
      dog: {
        name: 'Dog Name is required',
        age: 'Dog Age is required',
      },
    },
  });
});
