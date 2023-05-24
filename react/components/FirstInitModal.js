const { ipcRenderer, shell } = require('electron');
import React, { useState, useEffect } from 'react';
import { Button, Modal, Input } from 'antd';
import { FormOutlined } from '@ant-design/icons';

const FirstInitModal = () => {
  const [firstModelOpen, setFirstModalOpen] = useState(true);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);

  //When closing the model, regardless of the reason, we emit an event to indicate that the steps through the first start have been completed
  useEffect(() => {
    if (!firstModelOpen) {
      ipcRenderer.send('setFirstInitReady', true);
    }
  }, [firstModelOpen]);

  const handleOpenaiApiKeyChange = (event) => {
    setOpenaiApiKey(event.target.value);
  };

  const renderWrongApiKeyAlert = () => {
    if (!isApiKeyValid) {
      return (
        <div style={{ fontSize: '12px', color: 'red' }}>
          The Key is not valid
        </div>
      );
    }
    return;
  };

  //When a user clicks "Save API Key"
  const onSetApiKey = async () => {
    const config = {};
    //Synchronously validate the key
    if (openaiApiKey.trim() !== '') {
      const isValid = await ipcRenderer.invoke('checkApiKey');
      if (isValid) {
        setIsApiKeyValid(true);
        config['openaiApiKey'] = openaiApiKey.trim();

        //Send configuration update to the main thread
        //In this case we only send the property "openaiApiKey"
        ipcRenderer.send('setConfig', config);

        //Close the modal
        setFirstModalOpen(false);
      }
    }
    //TODO: should this be exceptional?
    setIsApiKeyValid(false);
    return;
  };

  return (
    <Modal
      title="Welcome - Initial setup"
      centered
      open={firstModelOpen}
      onOk={() => setFirstModalOpen(false)}
      onCancel={() => setFirstModalOpen(false)}
      closable={false}
      maskClosable={false}
      footer={[
        <Button type="primary" onClick={() => onSetApiKey()}>
          Save API Key
        </Button>,
        <Button onClick={() => setFirstModalOpen(false)}>...Set up later</Button>,
      ]}
    >
      <p style={{ textAlign: 'justify' }}>
        Enter your OpenAI API Key. If you don't have one, you can create an
        account and generate it by following
        <a
          onClick={() =>
            shell.openExternal('https://platform.openai.com/account/api-keys')
          }
        >
          {' '}
          this link{' '}
        </a>
        Without the API Key, the system won't be able to perform translations.
      </p>
      <div style={{ fontWeight: 'bold' }}>API KEY OpenAI</div>
      <Input.Password
        placeholder="API KEY"
        value={openaiApiKey}
        onChange={handleOpenaiApiKeyChange}
        maxLength={51}
        style={{ maxWidth: 300 }}
        suffix={<FormOutlined />}
        required
      />
      {renderWrongApiKeyAlert()}
      <div style={{ marginBottom: '30px' }} />
    </Modal>
  );
};

export default FirstInitModal;
