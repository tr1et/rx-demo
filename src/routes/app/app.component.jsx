import { Component } from 'react';
import { Layout } from 'antd';

import { Footer, Header } from './components';
import './app.style.scss';

export class App extends Component {
  state = {
    name: 'rx-demo',
  };

  render() {
    return (
      <Layout className="app">
        <Header className="app__header" />
        <Layout.Content className="app__content">Content {this.state.name}</Layout.Content>
        <Footer className="app__footer" />
      </Layout>
    );
  }
}
