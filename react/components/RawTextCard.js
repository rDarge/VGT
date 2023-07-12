const { ipcRenderer } = require('electron');
import React, { useState, useEffect } from 'react';
import { Button, Input, Spin, Typography, Pagination, Tooltip, Select, Switch } from 'antd';
import { ClearOutlined, LikeOutlined, RedoOutlined } from '@ant-design/icons';

const OCR_OPTIONS = [
  {
    label: 'MangaOCR',
    value: 'mangaOCR'
  },
  {
    label: 'WinOCR',
    value: 'winOCR'
  }
];

const RawTextCard = ({ text: entryText, onChange, ocrCallback, config }) => {
  const [localText, setLocalText] = useState(entryText);
  const [autoClean, setAutoClean] = useState(true);
  const [thinking, setThinking] = useState(true);

  useEffect(() => {
    if (entryText && autoClean) {
      setLocalText(cleanText(entryText));
    } else {
      setLocalText(entryText);
    }

    if (entryText) {
      setThinking(false);
    }
  }, [entryText]);

  const updateText = (event) => {
    setLocalText(event.target.value);
    onChange(event.target.value);
  }

  const rescanEntry = () => {
    setLocalText("");
    setThinking(true);
    ocrCallback();
  };

  const toggleCleanEntry = (checked) => {
    setAutoClean(checked);
    if (checked) {
      setLocalText(cleanText(localText));
    } else {
      onChange("");
      rescanEntry();
    }
  }

  const cleanText = (text) => {
    return text.replaceAll(' ', '');
  }

  const onChangeMode = (value) => {
    const newMode = OCR_OPTIONS.filter(m => value.indexOf(m.value) >= 0)[0];

    //Update configs if both a prompt and model are selected
    if (newMode) {
      const newConfig = {
        ...config,
        selectedOcrMode: newMode.value
      };
      ipcRenderer.send('setConfig', newConfig);
      rescanEntry();
    }
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
        <Select
          style={{ width: 100 }}
          onChange={onChangeMode}
          size='small'
          defaultValue={config.selectedOcrMode}
          disabled={thinking}
          options={OCR_OPTIONS} />
        <Tooltip title={"Remove whitespace between characters"} >
          <Switch
            checkedChildren={<ClearOutlined style={{ fontSize: '14px' }} />}
            unCheckedChildren={<LikeOutlined style={{ fontSize: '14px' }} />}
            defaultChecked={autoClean}
            onChange={toggleCleanEntry}
          />
        </Tooltip>
      </div>
      {thinking ? (
        <Spin />
      ) : (
        <Input.TextArea
          style={{ flexGrow: '1', resize: 'none' }}
          value={localText}
          autoSize={{ maxRows: 10 }}
          onChange={updateText}
        />
      )}
    </div>
  );
}

export default RawTextCard