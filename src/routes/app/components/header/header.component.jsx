import React from 'react';
import { string } from 'prop-types';
import { Layout, Menu } from 'antd';

import './header.style.scss';

export const Header = props => (
  <Layout.Header className={`header ${props.className}`}>
    <div className="header__logo">Rx-Demo</div>
    <Menu className="header__menu" theme="dark" mode="horizontal">
      <Menu.Item key="1">Deals</Menu.Item>
      <Menu.Item key="2">Group</Menu.Item>
      <Menu.Item key="3">About</Menu.Item>
    </Menu>
  </Layout.Header>
);

Header.propTypes = {
  className: string,
};

Header.defaultProps = {
  className: '',
};
