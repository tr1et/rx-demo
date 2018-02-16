import { Component, Fragment } from 'react';
import { string, number, func, objectOf, instanceOf } from 'prop-types';
import { Card, Icon, Avatar, Progress } from 'antd';
import { clamp } from 'lodash';

import { Store } from 'shared/services';
import { rxBind } from 'shared/utilities';

import { postRxActions } from './post.action';
import { postRxState } from './post.store';

export class Post extends Component {
  static propTypes = {
    poster: string.isRequired,
    avatar: string.isRequired,
    title: string.isRequired,
    message: string,
    maxLikes: number.isRequired,
    rxState: objectOf(instanceOf(Store)),
    rxActions: objectOf(func),
  };

  static defaultProps = {
    message: '',
    rxState: postRxState,
    rxActions: postRxActions,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      likes: props.rxState.likes.value,
    };
    this.onIncrease = rxBind();
    this.onDecrease = rxBind();
  }

  componentWillMount() {
    const { rxState, rxActions } = this.props;

    this.onIncrease.$.subscribe(() => rxActions.changeLikes(1));
    this.onDecrease.$.subscribe(() => rxActions.changeLikes(-1));

    rxState.likes.$.subscribe(likes => this.setState({ likes }));
  }

  render() {
    const {
      poster,
      avatar,
      title,
      message,
      maxLikes,
    } = this.props;
    const { likes } = this.state;
    const percent = clamp((likes / maxLikes) * 100, 100);

    return (
      <Fragment>
        <Card
          cover={<img alt="poster" src={poster} />}
          actions={[
            <Icon type="like-o" onClick={this.onIncrease} />,
            <span className="center">+{likes}</span>,
            <Icon type="dislike-o" onClick={this.onDecrease} />,
          ]}
        >
          <Card.Meta
            avatar={<Avatar size="large" src={avatar} />}
            title={title}
            description={message}
          />
        </Card>
        <Progress percent={percent} showInfo={false} />
      </Fragment>
    );
  }
}
