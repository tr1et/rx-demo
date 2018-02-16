import React from 'react';
import { string } from 'prop-types';
import { Layout, Menu } from 'antd';

import './sider.style.scss';

export const Sider = props => (
  <Layout.Sider breakpoint="lg" collapsedWidth="0" className={`sider z2 ${props.className}`}>
    <div className="sider__logo">Rx-Demo</div>
    <Menu className="sider__menu" theme="dark" mode="inline">
      <Menu.Item key="1">Deals</Menu.Item>
      <Menu.Item key="2">Group</Menu.Item>
      <Menu.Item key="3">About</Menu.Item>
    </Menu>
  </Layout.Sider>
);

Sider.propTypes = {
  className: string,
};

Sider.defaultProps = {
  className: '',
};
