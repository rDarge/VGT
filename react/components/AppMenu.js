import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Menu } from 'antd';
import { ipcRenderer } from 'electron';
import { RedoOutlined } from '@ant-design/icons';


const AppMenu = () => {
  const [current, setCurrent] = useState('mode1');

  const location = useLocation();

  const onClick = (e) => {
    if(e.key === "/reset") {
      ipcRenderer.send('reset');
    } else {
      setCurrent(e.key);
    }
  };
  
  useEffect(() => {
    if (current !== location.pathname) {
      setCurrent(location.pathname);
    }
  }, [location]);

  return (
    <div id="header">
      <Menu
        theme="dark"
        mode="horizontal"
        onClick={(e) => onClick(e)}
        selectedKeys={current}
        style={{ minWidth: 0, flex: 'auto' }}
      >
        <Menu.Item key="/">
          <Link to="/">Mode 1</Link>
        </Menu.Item>
        <Menu.Item key="/config">
          <Link to="/config">Config</Link>
        </Menu.Item>
        <Menu.Item key="/reset">
          <RedoOutlined style={{ fontSize: '14px' }} />
        </Menu.Item>
      </Menu>
      
    </div>
  );
};

export default AppMenu;
