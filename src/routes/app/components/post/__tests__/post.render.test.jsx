import React from 'react';
import { mount } from 'enzyme';
import { rxSandbox } from 'rx-sandbox';
import faker from 'faker';
import delay from 'promise-delay';

import { Post } from '../post.component';

faker.seed(1234);

const defaultProps = {
  poster: faker.image.imageUrl(),
  avatar: faker.image.imageUrl(),
  title: faker.name.findName(),
  message: faker.lorem.sentence(),
  maxLikes: 1000,
};
let marbles = null;

const normalStateTest = () => {
  test('HTML of component in normal state', async () => {
    // arrange
    const rxState = { likes$: marbles.cold('a', { a: 120 }) };
    const props = { ...defaultProps, rxState };

    expect.assertions(2);

    // act
    const wrapper = mount(<Post {...props} />);
    marbles.flush();
    await delay(0, 0);

    const likesCountElement = wrapper.find('.post__likes-count');
    const html = wrapper.html();

    // assert
    expect(likesCountElement.text()).toBe('+120');
    expect(html).toMatchSnapshot();
  });
};

const likeStreakStateTest = () => {
  test('HTML of component in like streak state', async () => {
    // arrange
    const rxState = { likes$: marbles.cold('a', { a: 120 }) };
    const props = { ...defaultProps, rxState };
    const state = {
      streak: 25,
      buffer: 80,
    };

    expect.assertions(4);

    // act
    const wrapper = mount(<Post {...props} />);
    marbles.flush();
    wrapper.setState(state);
    await delay(0, 0);

    const likesCountElement = wrapper.find('.post__likes-count');
    const likeStreakElement = wrapper.find('.post__streak');
    const html = wrapper.html();

    // assert
    expect(likesCountElement.text()).toBe('+200');
    expect(likeStreakElement.text()).toBe('x25');
    expect(likeStreakElement.prop('style')).toEqual({ transform: 'scale(3) translateY(-1em)' });
    expect(html).toMatchSnapshot();
  });
};

describe('post.snapshot.test.js', () => {
  beforeEach(() => {
    marbles = rxSandbox.create();
  });

  normalStateTest();
  likeStreakStateTest();
});
