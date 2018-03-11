import React from 'react';
import { mount } from 'enzyme';
import { rxSandbox } from 'rx-sandbox';
import faker from 'faker';
import { Observable } from 'rxjs';
import each from 'jest-each';
import sinon from 'sinon';

import { stubOperatorsWithScheduler } from 'tests/utilities';

import { Post } from '../post.component';

const { marbleAssert } = rxSandbox;

faker.seed(1234);

const defaultProps = {
  poster: faker.image.imageUrl(),
  avatar: faker.image.imageUrl(),
  title: faker.name.findName(),
  message: faker.lorem.sentence(),
  maxLikes: 1000,
  rxState: { likes$: Observable.empty() },
};
let marbles = null;

// const componenWillMountTest = () => {
//   describe('componentWillMount()', () => {
//     describe('Fire changesLikes action when likes streak end', () => {
//       const values = { l: 1, d: -1 };

//       test('Fire changes likes action', ({ likesOrDislikes }) => {
//         // arrange
//         const likesOrDislikes$ = marbles.hot(likesOrDislikes, values);
//         const expected

//       });
//     });
//   });
// };

const rxStateLikes$Test = () => {
  describe('rxStateLikes$', () => {
    const values = { a: 10, b: 20, c: 30, d: 40 };

    test('It emits all items', () => {
      // arrange
      const likes$ = marbles.cold('     a--b--c--', values);
      const expectedResult = marbles.e('a--b--c--', values);
      const rxState = { likes$ };
      const props = { ...defaultProps, rxState };

      // act
      const wrapper = mount(<Post {...props} />);
      const instance = wrapper.instance();
      const result = marbles.getMessages(instance.rxStateLikes$);

      marbles.flush();

      // assert
      marbleAssert(result).to.equal(expectedResult);
    });

    test('It stop emits when the component unmount', () => {
      // arrange
      const likes$ = marbles.cold('     a--b--c--d--', values);
      const expectedResult = marbles.e('a--b-|', values);
      const rxState = { likes$ };
      const props = { ...defaultProps, rxState };

      // act
      const wrapper = mount(<Post {...props} />);
      const instance = wrapper.instance();
      const result = marbles.getMessages(instance.rxStateLikes$);

      marbles.advanceTo(50);
      wrapper.unmount();
      marbles.flush();

      // assert
      marbleAssert(result).to.equal(expectedResult);
    });
  });
};

const likesOrDislikes$Test = () => {
  describe('likesOrDislikes$', () => {
    const emitsValues = { a: 10, b: 20, c: 30 };

    each([
      [
        {
          likes: '   ^--a-b--c--',
          dislikes: '^----------',
          expected: '---a-b--c--',
          expectedValues: { a: 1, b: 1, c: 1 },
        },
      ],
      [
        {
          likes: '   ^----------',
          dislikes: '^--a-b--c--',
          expected: '---a-b--c--',
          expectedValues: { a: -1, b: -1, c: -1 },
        },
      ],
      [
        {
          likes: '   ^--a----c--',
          dislikes: '^----b-----',
          expected: '---a-b--c--',
          expectedValues: { a: 1, b: -1, c: 1 },
        },
      ],
      [
        {
          likes: '   ^----------',
          dislikes: '^----------',
          expected: '----------',
          expectedValues: {},
        },
      ],
    ]).test('It emits all items', ({ likes, dislikes, expected, expectedValues }) => {
      // arrange
      const likes$ = marbles.hot(likes, emitsValues);
      const dislikes$ = marbles.hot(dislikes, emitsValues);
      const expectedResult = marbles.e(expected, expectedValues);

      // act
      const wrapper = mount(<Post {...defaultProps} />);
      const instance = wrapper.instance();

      instance.onIncrease.$ = likes$;
      instance.onDecrease.$ = dislikes$;

      const result = marbles.getMessages(instance.likesOrDislikes$);

      marbles.flush();

      // assert
      marbleAssert(result).to.equal(expectedResult);
    });

    each([
      [
        {
          likes: '   ^--a-b--c--',
          dislikes: '^----------',
          expected: '---a|',
          expectedValues: { a: 1 },
        },
      ],
      [
        {
          likes: '   ^----------',
          dislikes: '^--a-b--c--',
          expected: '---a|',
          expectedValues: { a: -1 },
        },
      ],
      [
        {
          likes: '   ^--a----c--',
          dislikes: '^----b-----',
          expected: '---a|',
          expectedValues: { a: 1 },
        },
      ],
      [
        {
          likes: '   ^----------',
          dislikes: '^----------',
          expected: '----|',
          expectedValues: {},
        },
      ],
    ]).test(
      'It stop emits when the component unmount',
      ({ likes, dislikes, expected, expectedValues }) => {
        // arrange
        const likes$ = marbles.hot(likes, emitsValues);
        const dislikes$ = marbles.hot(dislikes, emitsValues);
        const expectedResult = marbles.e(expected, expectedValues);

        // act
        const wrapper = mount(<Post {...defaultProps} />);
        const instance = wrapper.instance();

        instance.onIncrease.$ = likes$;
        instance.onDecrease.$ = dislikes$;

        const result = marbles.getMessages(instance.likesOrDislikes$);

        marbles.advanceTo(40);
        wrapper.unmount();
        marbles.flush();

        // assert
        marbleAssert(result).to.equal(expectedResult);
      }
    );
  });
};

const stopLikesOrDislikes$Test = () => {
  describe('stopLikesOrDislikes$', () => {
    const emitsValues = { a: 10, b: 20, c: 30 };
    let sandbox = null;

    beforeEach(() => {
      sandbox = stubOperatorsWithScheduler(marbles.scheduler);
    });

    afterEach(() => {
      sandbox.restore();
    });

    each([
      [
        {
          likesOrDislikes: '^-a-b-c-...27...-----',
          expected: '       --------...27...-o---',
        },
      ],
      [
        {
          likesOrDislikes: '^-a-b-c-  |',
          expected: '       --------(o|)',
        },
      ],
      [
        {
          likesOrDislikes: '^-a-...27...-b-...27...-----',
          expected: '       ----...27...---...27...-o---',
        },
      ],
      [
        {
          likesOrDislikes: '^-a-...27...--b-...27...-----',
          expected: '       ----...27...-o--...27...-o---',
        },
      ],
      [
        {
          likesOrDislikes: '^---...27...---',
          expected: '       ----...27...---',
        },
      ],
    ]).it('Emits 300ms after the user stop like/dislike', ({ likesOrDislikes, expected }) => {
      // arrange
      const likesOrDislikes$ = marbles.hot(likesOrDislikes, emitsValues);
      const expectedResult = marbles.e(expected, { o: 0 });

      // act
      const wrapper = mount(<Post {...defaultProps} />);
      const instance = wrapper.instance();
      const likesOrDislikes$Stub = sinon
        .stub(instance, 'likesOrDislikes$')
        .get(() => likesOrDislikes$);

      // eslint-disable-next-line
      instance._stopLikesOrDislikes$ = null;

      const result = marbles.getMessages(instance.stopLikesOrDislikes$);

      marbles.flush();

      // assert
      marbleAssert(result).to.equal(expectedResult);

      // restore
      likesOrDislikes$Stub.restore();
    });
  });
};

const likeStreaks$Test = () => {
  describe('likeStreaks$', () => {
    const emitsValues = { a: 10, b: 20, c: 30 };
    const expectedValues = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
    let sandbox = null;

    beforeEach(() => {
      sandbox = stubOperatorsWithScheduler(marbles.scheduler);
    });

    afterEach(() => {
      sandbox.restore();
    });

    each([
      [
        {
          likesOrDislikes: '    ^-a-b-c-...27...---------------------------------------',
          expected: '           a-b-c-d-...27...---...12...-c-...12...-b-...12...-a----',
        },
      ],
      [
        {
          likesOrDislikes:
            '^-a-b-...27...---...12...--a-b------------------------------------------------',
          expected:
            'a-b-c-...27...---...12...-bc-d-...27...---...12...-c-...12...-b-...12...-a----',
        },
      ],
    ]).it('Emits 300ms after the user stop like/dislike', ({ likesOrDislikes, expected }) => {
      // arrange
      const likesOrDislikes$ = marbles.hot(likesOrDislikes, emitsValues);
      const expectedResult = marbles.e(expected, expectedValues);

      // act
      const wrapper = mount(<Post {...defaultProps} />);
      const instance = wrapper.instance();
      const likesOrDislikes$Stub = sinon
        .stub(instance, 'likesOrDislikes$')
        .get(() => likesOrDislikes$);

      // eslint-disable-next-line
      instance._stopLikesOrDislikes$ = null;
      // eslint-disable-next-line
      instance._likeStreaks$ = null;

      const result = marbles.getMessages(instance.likeStreaks$);

      marbles.flush();

      // assert
      marbleAssert(result).to.equal(expectedResult);

      // restore
      likesOrDislikes$Stub.restore();
    });
  });
};

const bufferedChangesToLikesState$Test = () => {
  describe('bufferedChangesToLikesState$', () => {
    const likesOrDislikesValues = { l: 1, d: -1 };
    let sandbox = null;

    beforeEach(() => {
      sandbox = stubOperatorsWithScheduler(marbles.scheduler);
    });

    afterEach(() => {
      sandbox.restore();
    });

    each([
      [
        {
          likesOrDislikes: '    ^-lll-...27...---...12...---...12...--lllllllllll-',
          expected: '           --abc-...27...---...12...---...12...--defghijklmn-',
          expectedValues: {
            a: 1,
            b: 2,
            c: 3,
            d: 1,
            e: 2,
            f: 3,
            g: 4,
            h: 5,
            i: 6,
            j: 7,
            k: 8,
            l: 9,
            m: 11,
            n: 13,
          },
        },
      ],
    ]).it(
      'Return the accumulated likes changes when user stop',
      ({ likesOrDislikes, expected, expectedValues }) => {
        // arrange
        const likesOrDislikes$ = marbles.hot(likesOrDislikes, likesOrDislikesValues);
        const expectedResult = marbles.e(expected, expectedValues);

        // act
        const wrapper = mount(<Post {...defaultProps} />);
        const instance = wrapper.instance();
        const likesOrDislikes$Stub = sinon
          .stub(instance, 'likesOrDislikes$')
          .get(() => likesOrDislikes$);

        /* eslint-disable */
        instance._bufferedChangesToLikesState$ = null;
        instance._stopLikesOrDislikes$ = null;
        instance._likeStreaks$ = null;
        /* eslint-enable */

        const result = marbles.getMessages(instance.bufferedChangesToLikesState$);

        marbles.flush();

        // assert
        marbleAssert(result).to.equal(expectedResult);

        // restore
        likesOrDislikes$Stub.restore();
      }
    );
  });
};

describe('post.behavior.test.js', () => {
  beforeEach(() => {
    marbles = rxSandbox.create(false, 10);
  });

  rxStateLikes$Test();
  likesOrDislikes$Test();
  stopLikesOrDislikes$Test();
  likeStreaks$Test();
  bufferedChangesToLikesState$Test();
});
