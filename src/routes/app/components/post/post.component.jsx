import { Component, Fragment } from 'react';
import { string, number, func, objectOf, instanceOf } from 'prop-types';
import { Card, Icon, Avatar, Progress } from 'antd';
import { Observable, Subject } from 'rxjs';
import { clamp } from 'lodash';

import { Store } from 'shared/services';
import { rxBind } from 'shared/utilities';

import { postRxActions } from './post.action';
import { postRxState } from './post.store';
import {
  LIKE_STREAK_DEBOUNCE_TIME,
  LIKE_STREAK_START_THRESHOLD,
  LIKE_STREAK_MULTIPLY_FACTOR,
  LIKE_STREAK_SPAN_MINIMUM_ZOOM,
  LIKE_STREAK_SPAN_MAXIMUM_ZOOM,
} from './post.constant';
import './post.style.scss';

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
      streak: 0,
      buffer: 0,
    };
    this.onIncrease = rxBind();
    this.onDecrease = rxBind();
    this.unsubscribe$ = new Subject();
  }

  /**
   * Setup observables when component mount
   *
   * @returns {void}
   *
   * @memberOf Post
   */
  componentWillMount() {
    // The changes to `likes` multiplied with streak factor
    const multipliedChangesToLikes$ = this.changesToLikes$.withLatestFrom(
      this.likeStreaks$,
      this.getMultipliedChangeOfLikes,
    );

    // Start a buffer of changes to `likes` state at the beginning
    // and reset everytime the streak end
    const bufferedChangesToLikes$ = Observable.of('START')
      .merge(this.endOfLikeStreak$)
      .switchMap(() => multipliedChangesToLikes$.scan((buffer, change) => buffer + change, 0))
      .share();

    // Dispatch the buffered `likes` changes to Rx store when the streak end
    // Used to reduce update requests to Rx state.
    bufferedChangesToLikes$
      .audit(() => this.endOfLikeStreak$)
      .subscribe(this.props.rxActions.changeLikes);

    // Update component state based on Rx `likes` state, the like streak and the current buffered
    // change
    Observable
      .combineLatest(
        this.rxLikes$,
        this.likeStreaks$,
        bufferedChangesToLikes$.merge(this.endOfLikeStreak$),
        (likes, streak, buffer) => ({
          likes,
          streak,
          buffer,
        }),
      )
      .debounceTime(0)
      .subscribe(newState => this.setState(newState));
  }

  /**
   * Unsubscribe all observable when the component unmount
   *
   * @returns {void}
   *
   * @memberOf Post
   */
  componentWillUnmount() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * The observable of `likes` state in Rx state
   *
   * @readonly
   *
   * @memberOf Post
   */
  get rxLikes$() {
    return this.props.rxState.likes.$.takeUntil(this.unsubscribe$);
  }

  /**
   * The observable of changes to `likes` state, includes both "like" and "dislike".
   * It doesn't actually changes the `likes` state
   *
   * @readonly
   *
   * @memberOf Post
   */
  get changesToLikes$() {
    // The observable of `like` click, map to the amount of adding likes
    const like$ = this.onIncrease.$.takeUntil(this.unsubscribe$).mapTo(1);

    // The observable of `dislike` click, map to the amount of minusing likes
    const dislike$ = this.onDecrease.$.takeUntil(this.unsubscribe$).mapTo(-1);

    // The changes to `likes` state, combine `like` and `dislike`
    return Observable.merge(like$, dislike$);
  }

  /**
   * The observable of the ends of like streak
   * Emits when the the user stop like/dislike for a specified time
   *
   * @readonly
   *
   * @memberOf Post
   */
  get endOfLikeStreak$() {
    if (!this._endOfLikeStreak$) {
      this._endOfLikeStreak$ = this.changesToLikes$
        .debounceTime(LIKE_STREAK_DEBOUNCE_TIME)
        .mapTo(0)
        .share();
    }

    return this._endOfLikeStreak$;
  }

  /**
   * Observable of like streaks.
   * A like streak is is a range of likes/dislikes in a short time
   *
   * @readonly
   *
   * @memberOf Post
   */
  get likeStreaks$() {
    // The like streak, happen when there are many likes/dislikes continously in a short time
    const likeStreak$ = Observable.of('START')
      .merge(this.changesToLikes$)
      .map((_, i) => i)
      .takeUntil(this.endOfLikeStreak$);

    // The like streaks, contains multiple like streaks. A like streak can only starts when
    // the previous like streak has ended.
    return this.changesToLikes$.exhaustMap(() => likeStreak$).merge(this.endOfLikeStreak$);
  }

  /**
   * Get the multiplied change of `likes` state.
   * The multiply factor starts at 1 and double for every 10 likes/dislikes in the current like
   * streak.
   *
   * @param {number} change The original change to `likes` state
   * @param {number} streak The current streak score
   * @returns {number} Multiplied change
   *
   * @memberOf Post
   */
  getMultipliedChangeOfLikes = (change, streak) =>
    change * (2 ** Math.floor(streak / LIKE_STREAK_MULTIPLY_FACTOR));

  /**
   * Get the zoom level of the like streak span, with lower and upper cap
   *
   * @param {number} streak The current streak count
   * @returns {number} The zoom level of the span
   * @memberOf Post
   */
  getLikeStreakSpanZoom = streak =>
    clamp(
      Math.floor(streak / LIKE_STREAK_MULTIPLY_FACTOR),
      LIKE_STREAK_SPAN_MAXIMUM_ZOOM - LIKE_STREAK_SPAN_MINIMUM_ZOOM,
    ) + LIKE_STREAK_SPAN_MINIMUM_ZOOM;

  render() {
    const { poster, avatar, title, message, maxLikes } = this.props;
    const { likes, streak, buffer } = this.state;
    const percent = clamp(((likes + buffer) / maxLikes) * 100, 100);
    const zoomScale = this.getLikeStreakSpanZoom(streak);
    const centerSpan =
      streak >= LIKE_STREAK_START_THRESHOLD ? (
        <span
          className="post__streak z2 center inline-block red"
          style={{ transform: `scale(${zoomScale}) translateY(-1em)` }}
        >
          x{streak} (+{buffer})
        </span>
      ) : (
        <span className="post__likes-count center">+{likes + buffer}</span>
      );

    return (
      <Fragment>
        <Card
          cover={<img alt="poster" src={poster} />}
          actions={[
            <Icon className="post__like-button" type="like-o" onClick={this.onIncrease} />,
            centerSpan,
            <Icon className="post__dislike-button" type="dislike-o" onClick={this.onDecrease} />,
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
