const { ipcRenderer, shell } = require('electron');
import React, { useEffect, useState } from 'react';
import { Layout, Space } from 'antd';
import {
  Button,
  Input,
  Popconfirm,
  Card,
  Radio,
  Spin,
  Popover,
  Select as SelectAnt,
} from 'antd';

import { FormOutlined, QuestionCircleOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useGlobalState } from './state';

//TODO: Add an option to delete the model from the cache

const apiKeyHelp = (
  <div style={{ maxWidth: '300px' }}>
    You need to create an account in OpenAI and then generate a Key and put its
    value here.
    <br />
    <a
      onClick={() =>
        shell.openExternal('https://platform.openai.com/account/api-keys')
      }
    >
      Follow this link
    </a>
  </div>
);

const basePromptHelp = (
  <div style={{ maxWidth: '300px' }}>
    It is the instruction that precedes the text that will be translated by the
    OpenAI model.
    <br />
    <a
      onClick={() =>
        shell.openExternal(
          'https://platform.openai.com/docs/guides/completion#:~:text=You%20input%20some%20text%20as,I%20am%22%20with%20high%20probability.',
        )
      }
    >
      More info here
    </a>
  </div>
);

const Config = () => {
  const [config] = useGlobalState('config');

  const [loading, setLoading] = useState(true); //Determines if we have already loaded the configurations from the main thread
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [prompts, setPrompts] = useState([]); //Dropdown prompt list
  const [screenshotModifierKey, setScreenshotModifierKey] = useState('Ctrl');
  const [screenshotLetterKey, setScreenshotLetterKey] = useState('T');
  const [isConfigChanged, setIsConfigChange] = useState(false); //True if any changes have been made to the initial configuration
  const [isApiKeyValid, setIsApiKeyValid] = useState(true); //Controls feedback message in case the API key is not valid
  const [openIaModels, setOpenAiModels] = useState([]); //List of OpenAI models available for dropdown
  const [selectedOpenAiModel, setSelectedOpenAiModel] = useState(); //Selected model from the OpenAI model dropdown

  useEffect(() => {
    setIsConfigChange(false); //When loading a new configuration from the main thread, we assume no changes have been made yet
    //Every time the main thread config is changed, we update the component hooks
    if (Object.keys(config).length > 0) {
      //We do not run on the first render, as we don't have the config yet.
      setOpenaiApiKey(config.openaiApiKey);
      setPrompts(config.prompts);
      setScreenshotModifierKey(config.screenshotModifierKey);
      setScreenshotLetterKey(config.screenshotLetterKey);
      setOpenAiModels(config.openIaModels);
      setSelectedOpenAiModel(config.selectedOpenAiModel);

      setLoading(false); //We have completed the initial load of configurations
    }
  }, [config]);

  //To detect if a change has been made to the configurations
  useEffect(() => {
    if (!loading) {
      let changeInForm = false;
      if (openaiApiKey !== config.openaiApiKey) {
        changeInForm = true;
      }
      if (screenshotModifierKey !== config.screenshotModifierKey) {
        changeInForm = true;
      }
      if (screenshotLetterKey !== config.screenshotLetterKey) {
        changeInForm = true;
      }
      if (selectedOpenAiModel !== config.selectedOpenAiModel) {
        changeInForm = true;
      }
      changeInForm = changeInForm 
        || prompts.length != config.prompts.length 
        || prompts.filter((prompt, index) => config.prompts[index] !== prompt).length > 0;

      setIsConfigChange(changeInForm);
    }
  }, [
    openaiApiKey,
    screenshotModifierKey,
    screenshotLetterKey,
    prompts,
    selectedOpenAiModel
  ]);

  //To remove the invalid API Key alert message when the input is cleared
  useEffect(() => {
    if (openaiApiKey === '') {
      setIsApiKeyValid(true);
    }
  }, [openaiApiKey]);

  const handleOpenaiApiKeyChange = (event) => {
    setOpenaiApiKey(event.target.value);
  };

  const handleScreenshotModifierChange = (value) => {
    setScreenshotModifierKey(value.toUpperCase());
  };

  const handleScreenshotLetterChange = (event) => {
    setScreenshotLetterKey(event.target.value.toUpperCase());
  };

  const handleSelectedOpenAiModelChange = (value) => {
    setSelectedOpenAiModel(value);
  };
  
  const addNewPrompt = () => {
    const newPrompts = [...prompts];
    newPrompts.push({label: '', text:''});
    setPrompts(newPrompts);
  };

  const handleChangePromptLabel = (event, index) => {
    const newPrompt = {...prompts[index], label: event.target.value};
    const newPrompts = [...prompts];
    newPrompts.splice(index, 1, newPrompt);
    setPrompts(newPrompts);
  };

  const handleChangePromptText = (event, index) => {
    const newPrompt = {...prompts[index], text: event.target.value};
    const newPrompts = [...prompts];
    newPrompts.splice(index, 1, newPrompt);
    setPrompts(newPrompts);
  };

  const deletePrompt = (index) => {
    const newPrompts = [...prompts];
    newPrompts.splice(index, 1);
    setPrompts(newPrompts);
  }

  //By clicking "Apply"
  const onApplyConfig = async () => {
    //Settings that will always be selected
    const newConfig = {
      screenshotModifierKey: screenshotModifierKey,
      selectedOpenAiModel: selectedOpenAiModel,
    };

    //Asynchronously validate that the API Key is valid
    //If the key is empty, we skip the validation
    if (openaiApiKey.trim() !== '') {
      const isValid = await ipcRenderer.invoke('checkApiKey');
      if (isValid) {
        setIsApiKeyValid(true);
        newConfig['openaiApiKey'] = openaiApiKey.trim();
      } else {
        setIsApiKeyValid(false);
        return;
      }
    } else {
      setIsApiKeyValid(true);
      newConfig['openaiApiKey'] = openaiApiKey.trim();
    }

    //Apply changes to the screenshot letter key
    if (screenshotLetterKey.trim() !== '') {
      newConfig['screenshotLetterKey'] = screenshotLetterKey.trim();
    } else {
      return;
    }

    if (prompts.filter(p => p.text && p.label).length > 0) {
      newConfig['prompts'] = prompts;
      //If the user deletes the base prompt option, default to the first option
      if(prompts.filter(p => p.text === config.basePrompt).length === 0) {
        newConfig['basePrompt'] = prompts[0].text;
      }
    } else {
      return;
    }

    //Send the updated configurations to the main thread
    ipcRenderer.send('setConfig', newConfig);
  };

  const renderApiAlert = () => {
    if (!openaiApiKey || openaiApiKey === '') {
      return (
        <div style={{ fontSize: '12px', color: '#cc5800' }}>
          The translation cannot be performed without the API KEY
        </div>
      );
    }
    return null;
  };

  const renderScreenshotLetterKeyAlert = () => {
    if (!screenshotLetterKey || screenshotLetterKey === '') {
      return (
        <div style={{ fontSize: '12px', color: 'red' }}>
          You need to define a letter to be able to use the shortcut command
        </div>
      );
    }
    return null;
  };

  const onResetConfig = async () => {
    await ipcRenderer.send('resetConfig');
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

  //Load the content (or a loading icon if we don't have the main configs yet)
  const renderContent = () => {
    if (!loading) {
      return (
        <Space direction='vertical'>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Popover content={apiKeyHelp}>
              <QuestionCircleOutlined style={{ fontSize: '14px' }} />
            </Popover>
            <div style={{ fontWeight: 'bold', marginRight: 5, marginLeft: 5 }}>
              API KEY OpenAI
            </div>
            <div style={{ color: 'red' }}>*</div>
          </div>
          <Input.Password
            placeholder="API KEY"
            value={openaiApiKey}
            onChange={handleOpenaiApiKeyChange}
            maxLength={60}
            style={{ maxWidth: 450 }}
            suffix={<FormOutlined />}
            required
          />
          {renderApiAlert()}
          {renderWrongApiKeyAlert()}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Popover content={basePromptHelp}>
              <QuestionCircleOutlined style={{ fontSize: '14px' }} />
            </Popover>
            <div style={{ fontWeight: 'bold', marginRight: 5, marginLeft: 5 }}>
              Prompts
            </div>
            <Button
                  type='primary'
                  shape="circle"
                  size='small'
                  icon={<PlusOutlined />}
                  onClick={addNewPrompt}
                />
          </div>
          <Space direction='vertical'>
            {prompts.map((prompt, index) => 
              <Space key={`prompt-${index}`}>
                <Input key={`prompt-label-${index}`}
                  addonBefore="Label"
                  placeholder="JP→EN"
                  style={{ width: 150 }}
                  allowClear
                  value={prompt.label}
                  minLength={1}
                  status={prompt.label.length > 0 ? null : 'error'}
                  onChange={(event) => handleChangePromptLabel(event, index)}
                />
                <Input key={`prompt-text-${index}`}
                  addonBefore="Text"
                  placeholder="Translate from EN to JP"
                  allowClear
                  value={prompt.text}
                  minLength={1}
                  status={prompt.label.length > 0 ? null : 'error'}
                  onChange={(event) => handleChangePromptText(event, index)}
                />
                <Button key={`prompt-delete-${index}`}
                  danger="true"
                  shape="circle"
                  size='small'
                  icon={<DeleteOutlined />}
                  onClick={() => deletePrompt(index)}
                />
              </Space>
            )}
          </Space>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', marginRight: 5 }}>
              Screenshot shortcut
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SelectAnt
              style={{ minWidth: 80, marginRight: 10 }}
              placeholder="Select modifier key"
              value={screenshotModifierKey}
              onChange={handleScreenshotModifierChange}
            >
              <SelectAnt.Option value="Ctrl">CTRL</SelectAnt.Option>
              <SelectAnt.Option value="Shift">SHIFT</SelectAnt.Option>
            </SelectAnt>
            <div style={{ marginRight: '10px', alignSelf: 'center' }}>+</div>
            <Input
              placeholder="Enter letter key"
              value={screenshotLetterKey}
              onChange={handleScreenshotLetterChange}
              maxLength={1}
              style={{ width: 50, textAlign: 'center' }}
            />
          </div>
          {renderScreenshotLetterKeyAlert()}
          <br />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              type="primary"
              size="middle"
              onClick={() => onApplyConfig()}
              disabled={!isConfigChanged}
            >
              Apply
            </Button>
            <Popconfirm
              title="Reset"
              description="Are you sure you want to reset the settings?"
              onConfirm={onResetConfig}
              okText="Yes"
              cancelText="No"
            >
              <a>Reset to default</a>
            </Popconfirm>
          </div>
        </Space>
      );
    } else {
      return (
        <div style={{ textAlign: 'center' }}>
          <Spin />
        </div>
      );
    }
  };

  return (
    <Layout.Content className="site-layout content-padding">
      <Card
        title="Basic configurations"
        style={{ maxWidth: 600, margin: '0 auto' }}
      >
        {renderContent()}
      </Card>
    </Layout.Content>
  );
};

export default Config;
