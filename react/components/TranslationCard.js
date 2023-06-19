const { ipcRenderer } = require('electron');
import React, { useState, useEffect } from 'react';
import { Button, Input, Spin, Typography, Pagination, Tooltip, Select } from 'antd';
import { RedoOutlined, PlayCircleOutlined } from '@ant-design/icons';

const TRANSLATION_HINT = 'Confirm that the scanned text is correct, then press the translate button above to request translation.';

//TODO parameterize history length in settings
const MAX_HISTORY = 2;

const MODEL_OPTIONS = [
  {
    label: 'GPT-3.5t',
    value: 'gpt-3.5-turbo'
  }
];

const TranslationCard = ({ translation, translateCallback, config }) => {
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [prompts, setPrompts] = useState([]);
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    if (translation) {
      const newHistory = history.slice(-MAX_HISTORY);
      newHistory.push({
        text: translation,
        model: config.selectedOpenAiModel,
        prompt: config.basePrompt
      });
      setHistory(newHistory);
      setPage(newHistory.length);
      setBusy(false);
    }
  }, [translation]);

  useEffect(() => {
    if (prompts.length == 0) {
      //Set prompts that are not the base prompt disabled the first time
      setPrompts(config.prompts.map(p => {
        return {
          label: p.label,
          value: p.text,
          disabled: p.text !== config.basePrompt
        }
      }));
      setConfigReady(true);
    } else {
      //"Carry-over" the disabled state from previous renders
      setPrompts(config.prompts.map(p => {
        return {
          label: p.label,
          value: p.text,
          disabled: prompts.filter(old => old.value === p.text && old.disabled).length > 0
        }
      }));
    }

  }, [config.prompts]);

  const onTranslateEntry = () => {
    setBusy(true);
    translateCallback();
  };

  const onChangePage = (page) => {
    if (page >= 1 && page <= history.length) {
      setPage(page);
    }
  }

  //Called whenever the model or prompt selection is changed
  const onChangeMode = (value) => {
    const newPrompt = prompts.filter(p => value.indexOf(p.value) >= 0)[0];
    const newModel = MODEL_OPTIONS.filter(m => value.indexOf(m.value) >= 0)[0];

    //Disable other prompts if one is selected
    const newPrompts = [...prompts.map(p => newPrompt && p.value !== newPrompt.value ? { ...p, disabled: true } : { ...p, disabled: false })]
    setPrompts(newPrompts);

    //Update configs if both a prompt and model are selected
    if (newPrompt && newModel) {
      const newConfig = {
        ...config,
        basePrompt: newPrompt.value,
        selectedOpenAiModel: newModel.value
      };
      ipcRenderer.send('setConfig', newConfig);
      setConfigReady(true);
    } else {
      setConfigReady(false);
    }
  }

  //Called when valid prompts are provided
  const getDefaultOptions = () => {
    const defaultPrompt = prompts.filter(p => p.value === config.basePrompt);
    const defaultModel = MODEL_OPTIONS.filter(m => m.value === config.selectedOpenAiModel);
    return [...defaultPrompt, ...defaultModel];
  }

  //Realtime Config Options
  const generateOptions = [
    {
      label: 'Mode (Pick 1)',
      options: MODEL_OPTIONS
    }, {
      label: 'Prompt (Pick 1)',
      options: prompts
    }
  ];

  //Helper for tooltip detail
  const historyDetailsTooltip = `Model: ${history[page - 1]?.model} Prompt: ${history[page - 1]?.prompt}`

  return <div
    style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}
  >
    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
      {prompts.length > 0 ?
        <Select
          mode='multiple'
          style={{ width: 200 }}
          onChange={onChangeMode}
          size='small'
          defaultValue={getDefaultOptions}
          status={configReady ? null : 'error'}
          options={generateOptions} />
        :
        null
      }
      <Tooltip
        title={history.length <= MAX_HISTORY ? "" : "The oldest translation will be removed!"}
        color='red'
      >
        <Button
          shape="circle"
          size={'small'}
          disabled={busy || !configReady}
          onClick={onTranslateEntry}
          icon={history.length > 0 ? <RedoOutlined style={{ fontSize: '14px' }} /> : <PlayCircleOutlined style={{ fontSize: '14px' }} />}
        />
      </Tooltip>
      <Pagination
        current={page}
        hideOnSinglePage='true'
        defaultPageSize={1}
        defaultCurrent={1}
        size='small'
        showLessItems='true'
        style={{ display: 'inline-flex' }}
        total={history.length}
        onChange={onChangePage} />
    </div>
    {
      busy ?
        <Spin />
        :
        <Tooltip
          title={historyDetailsTooltip}
          placement='bottom'
          mouseEnterDelay={1}
        >
          <Input.TextArea
            style={{ flexGrow: '1', resize: 'none' }}
            disabled={history.length == 0}
            value={history[page - 1]?.text || TRANSLATION_HINT}
          />
        </Tooltip>}
  </div>
}

export default TranslationCard
