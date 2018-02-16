import { invoke } from 'lodash';
import { Subject } from 'rxjs';

/**
 * Create a binded method of a RxJS Subject. The Subject will emits whenever the binded method
 * get called,
 *
 * @param {Subject} bindSubject The RxJS Subject to bind the function to
 * @returns {function} The binded function that will emits the subject when called
 */
export const rxBind = (bindSubject) => {
  const subject = bindSubject || new Subject();
  const binded = (...args) => {
    invoke(subject, 'next', args.length === 1 ? args[0] : args);
  };

  binded.$ = subject;

  return binded;
};
