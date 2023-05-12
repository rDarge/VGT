const { shell } = require('electron');
import React from 'react';
import { Route, Routes, HashRouter } from 'react-router-dom';
import AppMenu from './AppMenu';
import Mode1 from './Mode1';
import Config from './Config';
import Capture from './Capture';
import FirstInitModal from './FisrtInitModal';
import InitModelSequenceModal from './InitModelSequenceModal';
import { useGlobalState } from './state';
import { GithubOutlined } from '@ant-design/icons';

const Main = () => {
  //The Menu, Footer and the use of a background for the content are only used in case the route loaded is not /capture, since that has a special way of being applied
  //TODO: Improve the code compared to above

  const [firstInitReady] = useGlobalState('firstInitReady');
  const [initModelSequenceReady] = useGlobalState('initModelSequenceReady');

  // Only render if the initial model check is *not* ready
  const renderInitModelSequenceModal = () => {
    if (!initModelSequenceReady) {
      return <InitModelSequenceModal />;
    }
    return null;
  };

  // Only render if we have not completed the firstInit
  // This applies only if we have already finished checking the model in the initial sequence
  const renderFirstInitModal = () => {
    if (initModelSequenceReady && !firstInitReady) {
      return <FirstInitModal />;
    }
    return null;
  };

  return (
    <HashRouter>
      <div id="global">
        {window.location.href.includes('/capture') ? null : <AppMenu />}
        <div
          id="content"
          style={{
            background: window.location.href.includes('/capture')
              ? null
              : 'gray',
          }}
        >
          <Routes>
            <Route path="/" element={<Mode1 />} />
            <Route path="/config" element={<Config />} />
            <Route path="/capture" element={<Capture />} />
          </Routes>
        </div>
        {window.location.href.includes('/capture') ? null : (
          <div id="footer">
            <div style={{ textAlign: 'center', padding: '4px' }}>
              <a
                style={{cursor: "pointer"}}
                onClick={() =>
                  shell.openExternal('https://github.com/K-RT-Dev/VGT')
                }
              >
                <GithubOutlined style={{ marginRight: 5 }} />
                Github
              </a>
            </div>
          </div>
        )}
        {renderInitModelSequenceModal()}
        {renderFirstInitModal()}
      </div>
    </HashRouter>
  );
};

export default Main;
