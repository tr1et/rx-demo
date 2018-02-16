import { clamp } from 'lodash';

import { Store } from 'shared/services';

import {
  APP_STATE,
  APP_STATE_LIKES,
  APP_STATE_LIKES_DEFAULT,
  ACTION_CHANGE_LIKES,
  MAX_LIKES,
} from './app.constant';

export const likes = new Store([APP_STATE, APP_STATE_LIKES], APP_STATE_LIKES_DEFAULT).addReducer(
  ACTION_CHANGE_LIKES,
  (currentLikes, { payload: changeAmount = 0 }) => clamp(currentLikes + changeAmount, MAX_LIKES),
);

export const appRxState = { likes };
