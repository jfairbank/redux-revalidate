# redux-revalidate

[![Travis branch](https://img.shields.io/travis/jfairbank/redux-revalidate/master.svg?style=flat-square)](https://travis-ci.org/jfairbank/redux-revalidate)
[![npm](https://img.shields.io/npm/v/redux-revalidate.svg?style=flat-square)](https://www.npmjs.com/package/redux-revalidate)

Validate your Redux store state with
[revalidate](https://github.com/jfairbank/revalidate).

The typical use case for revalidate is creating validation function Redux Form
components. However, if you're not using Redux Form but still want to validate
your Redux store, then you can use redux-revalidate to automatically perform the
validations. Redux-revalidate validates every new state produced by your reducer
function(s) according to the validate function you create with revalidate
itself. Redux-revalidate manages the error messages by adding its own state to
the store.

## Install

    $ npm install --save redux-revalidate

## Usage

Redux-revalidate exports a few functions to allow seamless integration with
revalidate.

### `validateStore`

The simplest approach is to validate your entire store thanks to the nested
field support of revalidate. You can use `validateStore` as a store enhancer to
validate your entire store according to the provided validate function.

`validateStore` takes as its first argument your validate function and an
optional options object as the second argument. `validateStore` will add an
object to the root of your store that will contain any possible error messages
for other properties in your store. The default key for this object is `errors`.
You can provide a different key if you're already using `errors` as a key
yourself. Just provide the `errorKey` option in the optional options argument:
e.g.<br>`validateStore(validate, { errorKey: 'myErrors' })`.

The API for `validateStore` is still new, but for now it will immediately
validate your store when Redux runs your reducer function the first time.  This
means error messages may immediately appear in your store before you've
dispatched any actions. If you want something more robust that handles whether a
particular field value is touched and when it should be validated, then you
should consider using Redux Form with revalidate.

Additionally, `validateStore` will validate your store after any dispatched
action.  Basically, if Redux calls your reducer function, then redux-revalidate
will validate the new state right after. 

```js
// ES2015 imports
import { createStore } from 'redux';
import { validateStore } from 'redux-revalidate';

import {
  combineValidators,
  composeValidators,
  isAlphabetic,
  isNumeric,
  isRequired,
} from 'revalidate';

// CJS imports
const createStore = require('redux').createStore;
const validateStore = require('redux-revalidate').validateStore;
const r = require('revalidate');
const combineValidators = r.combineValidators;
const composeValidators = r.composeValidators;
const isAlphabetic = r.isAlphabetic;
const isNumeric = r.isNumeric;
const isRequired = r.isRequired;

// Usage
const UPDATE_DOG_NAME = 'UPDATE_NAME';
const UPDATE_DOG_AGE = 'UPDATE_AGE';

const updateDogName = (payload) => ({ payload, type: UPDATE_DOG_NAME });
const updateDogAge = (payload) => ({ payload, type: UPDATE_DOG_AGE });

const INITIAL_STATE = {
  name: '',
  age: '',
};

function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case UPDATE_DOG_NAME:
      return { ...state, name: action.payload };

    case UPDATE_DOG_AGE:
      return { ...state, age: action.payload };

    default:
      return state;
  }
}

const validate = combineValidators({
  name: isRequired('Dog Name'),

  age: composeValidators(
    isRequired,
    isNumeric
  )('Dog Age'),
});

const store = createStore(reducer, validateStore(validate));

console.log(store.getState());

// { name: '',
//   age: '',
//   errors: { name: 'Dog Name is required',
//             age: 'Dog Age is required' } }

store.dispatch(updateDogName('Tucker'));
console.log(store.getState());

// { name: 'Tucker',
//   age: '',
//   errors: { age: 'Dog Age is required' } }

store.dispatch(updateDogAge('abc'));
console.log(store.getState());

// { name: 'Tucker',
//   age: 'abc',
//   errors: { age: 'Dog Age must be numeric' } }

store.dispatch(updateDogAge('10'));
console.log(store.getState());

// { name: 'Tucker', age: '10', errors: {} }
```

#### With optional `errorKey` option:

```js
const store = createStore(
  reducer,
  validateStore(validate, { errorKey: 'myErrors' })
);

console.log(store.getState());

// { name: '',
//   age: '',
//   myErrors: { name: 'Dog Name is required',
//               age: 'Dog Age is required' } }
```

#### With other enhancers like middleware

```js
import { applyMiddleware, compose, createStore } from 'redux';
import thunkMiddlware from 'redux-thunk';

// ...

function delayUpdateDogName(payload, time) {
  return (dispatch) => new Promise(resolve => {
    setTimeout(() => {
      dispatch(updateDogName(payload));
      resolve();
    }, time);
  });
}

// ...

const store = createStore(
  reducer,
  compose(
    validateStore(validate),
    applyMiddleware(thunkMiddlware)
  )
);

console.log(store.getState());

// { name: '',
//   age: '',
//   errors: { name: 'Dog Name is required',
//             age: 'Dog Age is required' } }

store.dispatch(delayUpdateDogName('Tucker', 1000))
  .then(() => {
    console.log(store.getState());

    // { name: 'Tucker',
    //   age: '',
    //   errors: { age: 'Dog Age is required' } }
  });
```

#### With nested properties

As previously mentioned, arbitrarily nested properties in the store can be
validated too:

```js
import { combineReducers, createStore } from 'redux';

import {
  combineValidators,
  composeValidators,
  isAlphabetic,
  isNumeric,
  isRequired,
} from 'revalidate';

import { validateStore } from 'redux-revalidate';

const UPDATE_CONTACT_NAME = 'UPDATE_CONTACT_NAME';
const UPDATE_CONTACT_AGE = 'UPDATE_CONTACT_AGE';
const UPDATE_DOG_BREED = 'UPDATE_DOG_BREED';
const UPDATE_DOG_NAME = 'UPDATE_DOG_NAME';
const UPDATE_DOG_AGE = 'UPDATE_DOG_AGE';

const updateContactName = (payload) => ({ payload, type: UPDATE_CONTACT_NAME });
const updateContactAge = (payload) => ({ payload, type: UPDATE_CONTACT_AGE });
const updateDogBreed = (payload) => ({ payload, type: UPDATE_DOG_BREED });
const updateDogName = (payload) => ({ payload, type: UPDATE_DOG_NAME });
const updateDogAge = (payload) => ({ payload, type: UPDATE_DOG_AGE });

const INITIAL_CONTACT = {
  name: '',
  age: '',
};

function contactReducer(state = INITIAL_CONTACT, action) {
  switch (action.type) {
    case UPDATE_CONTACT_NAME:
      return { ...state, name: action.payload };

    case UPDATE_CONTACT_AGE:
      return { ...state, age: action.payload };

    default:
      return state;
  }
}

const INITIAL_DOG = {
  breed: '',
  name: '',
  age: '',
};

function dogReducer(state = INITIAL_DOG, action) {
  switch (action.type) {
    case UPDATE_DOG_BREED:
      return { ...state, breed: action.payload };

    case UPDATE_DOG_NAME:
      return { ...state, name: action.payload };

    case UPDATE_DOG_AGE:
      return { ...state, age: action.payload };

    default:
      return state;
  }
}

const validate = combineValidators({
  'contact.name': isRequired('Name'),
  'contact.age': composeValidators(
    isRequired,
    isNumeric
  )('Age'),

  'dog.breed': isAlphabetic('Breed'),
  'dog.name': isRequired('Name'),
  'dog.age': composeValidators(
    isRequired,
    isNumeric
  )('Age'),
});

const reducer = combineReducers({
  contact: contactReducer,
  dog: dogReducer,
});

const store = createStore(
  reducer,
  validateStore(validate)
);

store.subscribe(() => console.log(store.getState()));

console.log(store.getState());

// { contact: { name: '', age: '' },
//   dog: { breed: '', name: '', age: '' },
//   errors:
//    { contact: { name: 'Name is required', age: 'Age is required' },
//      dog: { name: 'Name is required', age: 'Age is required' } } }

store.dispatch(updateContactName('Joe'));

// { contact: { name: 'Joe', age: '' },
//   dog: { breed: '', name: '', age: '' },
//   errors:
//    { contact: { age: 'Age is required' },
//      dog: { name: 'Name is required', age: 'Age is required' } } }

store.dispatch(updateContactAge('abc'));

// { contact: { name: '', age: 'abc' },
//   dog: { breed: '', name: '', age: '' },
//   errors:
//    { contact: { name: 'Name is required', age: 'Age must be numeric' },
//      dog: { name: 'Name is required', age: 'Age is required' } } }

store.dispatch(updateContactAge('30'));

// { contact: { name: 'Joe', age: '30' },
//   dog: { breed: '', name: '', age: '' },
//   errors:
//    { contact: {},
//      dog: { name: 'Name is required', age: 'Age is required' } } }

store.dispatch(updateDogBreed('123'));

// { contact: { name: 'Joe', age: '30' },
//   dog: { breed: '123', name: '', age: '' },
//   errors:
//    { contact: {},
//      dog:
//       { breed: 'Breed must be alphabetic',
//         name: 'Name is required',
//         age: 'Age is required' } } }

store.dispatch(updateDogBreed('Sheltie'));

// { contact: { name: 'Joe', age: '30' },
//   dog: { breed: 'Sheltie', name: '', age: '' },
//   errors:
//    { contact: {},
//      dog: { name: 'Name is required', age: 'Age is required' } } }

store.dispatch(updateDogName('Tucker'));

// { contact: { name: 'Joe', age: '30' },
//   dog: { breed: 'Sheltie', name: 'Tucker', age: '' },
//   errors: { contact: {}, dog: { age: 'Age is required' } } }

store.dispatch(updateDogAge('abc'));

// { contact: { name: 'Joe', age: '30' },
//   dog: { breed: 'Sheltie', name: 'Tucker', age: 'abc' },
//   errors: { contact: {}, dog: { age: 'Age must be numeric' } } }

store.dispatch(updateDogAge('10'));

// { contact: { name: 'Joe', age: '30' },
//   dog: { breed: 'Sheltie', name: 'Tucker', age: '10' },
//   errors: { contact: {}, dog: {} } }
```

#### Caveat:

If you use `combineReducers` like the previous example, you might see a warning
like this:

    Unexpected key "errors" found in previous state received by the reducer.
    Expected to find one of the known reducer keys instead: "contact", "dog".
    Unexpected keys will be ignored.

To fix this issue, import the function `errorsReducer` and mount it at the
`errors` key or whatever custom key you use to hold your error message state:

```js
import { errorsReducer } from 'redux-revalidate';

// ...

// With default key
const reducer = combineReducers({
  contact: contactReducer,
  dog: dogReducer,
  errors: errorsReducer,
});

// With custom `errorKey` supplied to `validateStore`
const reducer = combineReducers({
  contact: contactReducer,
  dog: dogReducer,
  myErrors: errorsReducer,
});
```

---

### `validateReducer`

If you want finer-grain control over what portions of your store are validated
and where to store the error message state, you can opt to wrap your reducer
function(s) with the `validateReducer` function.

`validateReducer` is a curried function. The first invocation takes the validate
function as the first argument and optional options argument as the second
argument. The returned function takes a reducer function as the first argument
and preloaded/initial state as the second argument. In fact, `validateStore`
uses `validateReducer` internally to just wrap your root reducer. Here is one of
the previous examples with the contact and dog but using `validateReducer` to
validate the dog state and store any dog validation errors in the same state as
the dog:

```js
import { combineReducers, createStore } from 'redux';

import {
  combineValidators,
  composeValidators,
  isAlphabetic,
  isNumeric,
  isRequired,
} from 'revalidate';

import {
  errorsReducer,
  validateReducer,
  validateStore,
} from 'redux-revalidate';

// ...

const validate = combineValidators({
  'contact.name': isRequired('Name'),

  'contact.age': composeValidators(
    isRequired,
    isNumeric
  )('Age'),
});

const validateDog = combineValidators({
  breed: isAlphabetic('Breed'),
  name: isRequired('Name'),
  age: composeValidators(
    isRequired,
    isNumeric
  )('Age'),
});

const reducer = combineReducers({
  contact: contactReducer,

  dog: validateReducer(
    validateDog, { errorKey: 'dogErrors' }
  )(dogReducer),

  errors: errorsReducer,
});

const store = createStore(
  reducer,
  validateStore(validate)
);

store.subscribe(() => console.log(store.getState()));

console.log(store.getState());

// { contact: { name: '', age: '' },
//   dog:
//    { breed: '',
//      name: '',
//      age: '',
//      dogErrors: { name: 'Name is required', age: 'Age is required' } },
//   errors: { contact: { name: 'Name is required', age: 'Age is required' } } }

store.dispatch(updateContactName(''));

// { contact: { name: '', age: '' },
//   dog:
//    { breed: '',
//      name: '',
//      age: '',
//      dogErrors: { name: 'Name is required', age: 'Age is required' } },
//   errors: { contact: { name: 'Name is required', age: 'Age is required' } } }

store.dispatch(updateContactName('Joe'));

// { contact: { name: 'Joe', age: '' },
//   dog:
//    { breed: '',
//      name: '',
//      age: '',
//      dogErrors: { name: 'Name is required', age: 'Age is required' } },
//   errors: { contact: { age: 'Age is required' } } }

store.dispatch(updateContactAge('abc'));

// { contact: { name: 'Joe', age: 'abc' },
//   dog:
//    { breed: '',
//      name: '',
//      age: '',
//      dogErrors: { name: 'Name is required', age: 'Age is required' } },
//   errors: { contact: { age: 'Age must be numeric' } } }

store.dispatch(updateContactAge('30'));

// { contact: { name: 'Joe', age: '30' },
//   dog:
//    { breed: '',
//      name: '',
//      age: '',
//      dogErrors: { name: 'Name is required', age: 'Age is required' } },
//   errors: { contact: {} } }

store.dispatch(updateDogBreed('123'));

// { contact: { name: 'Joe', age: '30' },
//   dog:
//    { breed: '123',
//      name: '',
//      age: '',
//      dogErrors:
//       { breed: 'Breed must be alphabetic',
//         name: 'Name is required',
//         age: 'Age is required' } },
//   errors: { contact: {} } }

store.dispatch(updateDogBreed('Sheltie'));

// { contact: { name: 'Joe', age: '30' },
//   dog:
//    { breed: 'Sheltie',
//      name: '',
//      age: '',
//      dogErrors: { name: 'Name is required', age: 'Age is required' } },
//   errors: { contact: {} } }

store.dispatch(updateDogName('Tucker'));

// { contact: { name: 'Joe', age: '30' },
//   dog:
//    { breed: 'Sheltie',
//      name: 'Tucker',
//      age: '',
//      dogErrors: { age: 'Age is required' } },
//   errors: { contact: {} } }

store.dispatch(updateDogAge('abc'));

// { contact: { name: 'Joe', age: '30' },
//   dog:
//    { breed: 'Sheltie',
//      name: 'Tucker',
//      age: 'abc',
//      dogErrors: { age: 'Age must be numeric' } },
//   errors: { contact: {} } }

store.dispatch(updateDogAge('10'));

// { contact: { name: 'Joe', age: '30' },
//   dog:
//    { breed: 'Sheltie',
//      name: 'Tucker',
//      age: '10',
//      dogErrors: {} },
//   errors: { contact: {} } }
```
