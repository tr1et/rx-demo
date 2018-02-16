import { dispatcher } from 'shared/services';

import { changeLikes } from '../../app.action';

export const postRxActions = { changeLikes: dispatcher(changeLikes) };
