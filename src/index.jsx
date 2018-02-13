import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'basscss/css/basscss.min.css';
import 'antd/dist/antd.css';

import './shared/style/index.scss';

import { App } from './routes';

const root = document.getElementById('root');
const load = () => render(
  (
    <AppContainer>
      <App />
    </AppContainer>
  ), root,
);

// This is needed for Hot Module Replacement
if (module.hot) {
  module.hot.accept('.', load);
}

load();
