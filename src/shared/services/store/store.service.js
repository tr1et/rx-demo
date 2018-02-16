import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { isArray, isEmpty, isString, isPlainObject, isNil, isObjectLike } from 'lodash';
import DynamicImmutable from 'seamless-immutable';

const Immutable = DynamicImmutable.static;
export const store$ = new BehaviorSubject(Immutable.from({}));
export const action$ = new Subject();

export class Store {
  constructor(path = [], defaultValue = {}) {
    if (!isArray(path)) {
      throw new Error('Store path must be a array of strings');
    }

    this.path = path || [];
    this.defaultValue = isNil(defaultValue) ? {} : defaultValue;
    this.immutableDefaultValue = Immutable.from(this.defaultValue);
    this.store$ = store$;
    this.action$ = action$;
  }

  /**
   * Set the store value at the preset path
   *
   * @param {any} value The new value
   * @returns {void}
   *
   * @memberOf Store
   */
  setValue(value) {
    const immutableValue = Immutable.from(value);
    const newState = Immutable.setIn(this.store$.value, this.path, immutableValue);

    this.store$.next(newState);
  }

  /**
   * Add a reducer to the store
   *
   * @param {any} type The action type matched with this reducer
   * @param {any} reducer The action reducer
   * @returns {Store} The current store
   *
   * @memberOf Store
   */
  addReducer(type, reducer) {
    this.action$
      .filter(action => action.type === type)
      .mergeMap((action) => {
        const result = reducer(this.value, action);

        return result instanceof Observable ? result : Observable.of(result);
      })
      .map(value => Immutable.setIn(this.store$.value, this.path, value))
      .subscribe(this.store$);

    return this;
  }

  /**
   * The current store value at the preset path
   *
   * @returns {any}
   * @readonly
   *
   * @memberOf Store
   */
  get value() {
    const immutableValue = isEmpty(this.path)
      ? this.store$.value
      : Immutable.getIn(this.store$.value, this.path, this.immutableDefaultValue);

    return this.toMutable(immutableValue);
  }

  /**
   * The observable of the store value at the preset path
   *
   * @returns {Observable<any>}
   * @readonly
   *
   * @memberOf Store
   */
  get $() {
    const observable = isEmpty(this.path) ? this.store$ : this.store$.pluck(...this.path);

    return observable
      .map(immutableValue =>
        (immutableValue === undefined ? this.immutableDefaultValue : immutableValue))
      .distinctUntilChanged()
      .map(this.toMutable);
  }

  /**
   * Convert immutable value to mutable value
   *
   * @param {any} The immutable value
   * @returns {any} The converted mutable value
   *
   * @memberOf Store
   */
  toMutable = value => (isObjectLike(value) ? Immutable.asMutable(value, { deep: true }) : value)
}

/**
 * Make an action dispatcher from action creator
 *
 * @param {function} actionCreator The method to create the action object
 * @returns {function} A method take the same arguments as the `actionCreator` and dispatch the
 *                     action.
 */
export const dispatcher = actionCreator => (...args) => {
  const action = actionCreator(...args);

  if (!isPlainObject(action) || !isString(action.type)) {
    throw new Error('Action must be a plain object with `type` field');
  }

  action$.next(action);
};
