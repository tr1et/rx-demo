import { ACTION_CHANGE_LIKES } from './app.constant';

export const changeLikes = amount => ({
  type: ACTION_CHANGE_LIKES,
  payload: amount,
});
