import { Component, Fragment } from 'react';
import { string, number, func, objectOf, instanceOf } from 'prop-types';
import { Card, Icon, Avatar, Progress } from 'antd';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { clamp } from 'lodash';

import { rxBind } from 'shared/utilities';

import { postRxActions } from './post.action';
import { postRxState } from './post.store';
import {
  LIKE_STREAK_DEBOUNCE_TIME,
  LIKE_STREAK_DECREASE_TIME,
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
    rxState: objectOf(instanceOf(Observable)),
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
      likes: 0,
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
    const multipliedChangesToLikesState$ = this.likesOrDislikes$.withLatestFrom(
      this.likeStreaks$,
      this.getMultipliedChangeOfLikes,
    );

    // Start a buffer of changes to `likes` state at the beginning
    // and reset everytime the streak end
    const bufferedChangesToLikesState$ = Observable.of('START')
      .merge(this.stopLikesOrDislikes$)
      .switchMap(() => multipliedChangesToLikesState$.scan((buffer, change) => buffer + change, 0))
      .share();

    // Dispatch the buffered `likes` changes to Rx store when the streak end
    // Used to reduce update requests to Rx state.
    bufferedChangesToLikesState$
      .audit(() => this.stopLikesOrDislikes$)
      .subscribe(this.props.rxActions.changeLikes);

    // Update component state based on Rx `likes` state, the like streak and the current buffered
    // change
    Observable
      .merge(
        this.rxStateLikes$.map(likes => ({ likes })),
        this.likeStreaks$.map(streak => ({ streak })),
        bufferedChangesToLikesState$.merge(this.stopLikesOrDislikes$).map(buffer => ({ buffer })),
      )
      .scan((state, newState) => ({ ...state, ...newState }), {})
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
  get rxStateLikes$() {
    return this.props.rxState.likes$.takeUntil(this.unsubscribe$);
  }

  /**
   * The observable of changes to `likes` state, includes both "like" and "dislike".
   * It doesn't actually changes the `likes` state
   *
   * @readonly
   *
   * @memberOf Post
   */
  get likesOrDislikes$() {
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
  get stopLikesOrDislikes$() {
    if (!this._stopLikesOrDislikes$) {
      this._stopLikesOrDislikes$ = this.likesOrDislikes$
        .debounceTime(LIKE_STREAK_DEBOUNCE_TIME)
        .mapTo(0)
        .share();
    }

    return this._stopLikesOrDislikes$;
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
    if (!this._likeStreaks$) {
      const likesObserver$ = new BehaviorSubject(0);
      const likeStreak$ = likesObserver$.scan((streak, value) => streak + value, 0).share();
      const likeStreakIsEmpty$ = likeStreak$.filter(streak => streak === 0);

      // The likes/dislikes will increase the streak
      this.likesOrDislikes$.mapTo(1).subscribe(likesObserver$);

      // The streak will decrease gradually when user stop like/dislike
      this.stopLikesOrDislikes$
        .switchMap(() => Observable
          .interval(LIKE_STREAK_DECREASE_TIME)
          .mapTo(-1)
          .takeUntil(likeStreakIsEmpty$.merge(this.likesOrDislikes$)))
        .subscribe(likesObserver$);

      this._likeStreaks$ = likeStreak$;
    }

    return this._likeStreaks$;
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
   * Get the zoom level of the like streak number, with lower and upper cap
   *
   * @param {number} streak The current streak count
   * @returns {number} The zoom level of the span
   * @memberOf Post
   */
  getLikeStreakZoom = streak =>
    clamp(
      Math.floor(streak / LIKE_STREAK_MULTIPLY_FACTOR),
      LIKE_STREAK_SPAN_MAXIMUM_ZOOM - LIKE_STREAK_SPAN_MINIMUM_ZOOM,
    ) + LIKE_STREAK_SPAN_MINIMUM_ZOOM;

  /**
   * Render the center span with present the likes number or the like streak
   *
   * @returns {Element}
   *
   * @memberOf Post
   */
  renderCenterSpan() {
    const { likes, streak, buffer } = this.state;

    if (streak < LIKE_STREAK_START_THRESHOLD) {
      return <span className="post__likes-count center">+{likes + buffer}</span>;
    }

    const likeStreakZoom = this.getLikeStreakZoom(streak);
    const likeStreakColor = buffer ? 'green' : 'red';

    return (
      <span>
        <span
          className={`post__streak z2 center absolute inline-block ${likeStreakColor}`}
          style={{ transform: `scale(${likeStreakZoom}) translateY(-1em)` }}
        >
          x{streak}
        </span>
        <span className="post__likes-count center">+{likes + buffer}</span>
      </span>
    );
  }

  /**
   * Render the component
   *
   * @returns {Element}
   *
   * @memberOf Post
   */
  render() {
    const { likes, buffer } = this.state;
    const { poster, avatar, title, message, maxLikes } = this.props;
    const percent = clamp(((likes + buffer) / maxLikes) * 100, 100);

    return (
      <Fragment>
        <Card
          cover={<img alt="poster" src={poster} />}
          actions={[
            <Icon className="post__like-button" type="like-o" onClick={this.onIncrease} />,
            this.renderCenterSpan(),
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
