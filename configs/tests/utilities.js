import sinon from 'sinon';
import { initial, last } from 'lodash';
import { Observable } from 'rxjs';
import { Scheduler } from 'rxjs/Scheduler';

const STATIC_TIME_OPERATORS = [
  'bindCallback',
  'bindNodeCallback',
  'combineLatest',
  'concat',
  'empty',
  'from',
  'fromPromise',
  'interval',
  'merge',
  'of',
  'range',
  'throw',
  'timer',
];
const PROTOTYPE_TIME_OPERATORS = [
  'auditTime',
  'bufferTime',
  'concat',
  'debounceTime',
  'delay',
  'expand',
  'merge',
  'observeOn',
  'publishReplay',
  'sampleTime',
  'startWith',
  'subscribeOn',
  'throttleTime',
  'timeout',
  'timeoutWith',
];

/**
 * Stub all RxJS operators with the TestScheduler to test time-related observable
 *
 * @param {Rx.Scheduler} scheduler The test scheduler
 * @returns {Sinon.Sandbox} The stub sandbox
 */
export const stubOperatorsWithScheduler = (scheduler) => {
  const sandbox = sinon.createSandbox();

  STATIC_TIME_OPERATORS.forEach((operator) => {
    const original = Observable[operator];

    // eslint-disable-next-line
    sandbox.stub(Observable, operator).callsFake(function (...args) {
      const lastArg = last(args);
      const firstArgs = initial(args);
      const newArgs =
        lastArg instanceof Scheduler ? [...firstArgs, scheduler] : [...args, scheduler];

      return original.bind(this)(...newArgs);
    });
  });

  PROTOTYPE_TIME_OPERATORS.forEach((operator) => {
    const original = Observable.prototype[operator];

    // eslint-disable-next-line
    sandbox.stub(Observable.prototype, operator).callsFake(function (...args) {
      const lastArg = last(args);
      const firstArgs = initial(args);
      const newArgs =
        lastArg instanceof Scheduler ? [...firstArgs, scheduler] : [...args, scheduler];

      return original.bind(this)(...newArgs);
    });
  });

  return sandbox;
};
