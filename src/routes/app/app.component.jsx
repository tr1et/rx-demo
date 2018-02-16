import { Component } from 'react';
import { objectOf, instanceOf } from 'prop-types';
import { Layout, Row, Col } from 'antd';
import { Subject } from 'rxjs';

import { Store } from 'shared/services';

import { appRxState } from './app.store';
import { CARD_POSTER_IMAGE, AVATAR_IMAGE, MAX_LIKES, CARD_TITLE, CARD_MESSAGE } from './app.constant';
import { Footer, Post, Sider } from './components';
import './app.style.scss';

export class App extends Component {
  static propTypes = {
    rxState: objectOf(instanceOf(Store)),
  };

  static defaultProps = {
    rxState: appRxState,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      likes: props.rxState.likes.value,
    };
    this.unsubscribe$ = new Subject();
  }

  componentWillMount() {
    const { rxState } = this.props;

    rxState.likes.$.takeUntil(this.unsubscribe$).subscribe(likes => this.setState({ likes }));
  }

  componentWillUnmount() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  render() {
    const { likes } = this.state;

    return (
      <Layout className="app">
        <Sider className="app__sider" />
        <Layout className="app__body">
          <Layout.Content className="app__content flex flex-column items-stretch">
            <Row type="flex" align="middle" justify="space-around" className="flex-auto">
              <Col xs={24} md={16} lg={8} className="center">
                <Post
                  poster={CARD_POSTER_IMAGE}
                  avatar={AVATAR_IMAGE}
                  title={CARD_TITLE}
                  message={CARD_MESSAGE}
                  maxLikes={MAX_LIKES}
                  likes={likes}
                />
              </Col>
            </Row>
          </Layout.Content>
          <Footer className="app__footer" />
        </Layout>
      </Layout>
    );
  }
}
