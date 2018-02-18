import React from 'react';
import { string } from 'prop-types';
import { Layout, Avatar } from 'antd';

export const Footer = (props) => {
  const avatarUrl = 'https://static.pexels.com/photos/20787/pexels-photo.jpg';

  return (
    <Layout.Footer className={`footer center h3 ${props.className}`}>
      Made by <Avatar size="large" src={avatarUrl} /> with{' '}
      <span className="h1 bold" role="img" aria-label="Heart">
        🖤
      </span>{' '}
      and{' '}
      <span className="h1 bold" role="img" aria-label="Time">
        🕑
      </span>
    </Layout.Footer>
  );
};

Footer.propTypes = { className: string };

Footer.defaultProps = { className: '' };
