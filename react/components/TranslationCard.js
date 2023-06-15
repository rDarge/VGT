import React, { useState, useEffect } from 'react';
import { Button, Input, Spin, Typography, Pagination, Tooltip } from 'antd';
import { RedoOutlined, PlayCircleOutlined } from '@ant-design/icons';

const TRANSLATION_HINT = 'Confirm that the scanned text is correct, then press the translate button above to request translation.';

//TODO parameterize history length in settings
const MAX_HISTORY = 2;

const TranslationCard = ({ translation, modelLabel, translateCallback }) => {
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (translation) {
      const newHistory = history.slice(-MAX_HISTORY);
      newHistory.push(translation);
      setHistory(newHistory);
      setPage(newHistory.length);
      setBusy(false);
    }
  }, [translation]);


  const onTranslateEntry = () => {
    setBusy(true);
    translateCallback();
  };

  const changePage = (page) => {
    if (page >= 1 && page <= history.length) {
      setPage(page);
    }
  }


  return <div
    style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}
  >
    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
      Translated text{' '}
      <Typography.Text
        code
        style={{ fontSize: '10px', verticalAlign: 'text-bottom' }}
      >
        {modelLabel}
      </Typography.Text>
      <Tooltip
        title={history.length <= MAX_HISTORY ? "" : "The oldest translation will be removed!"}
        color='red'
      >
        <Button
          shape="circle"
          size={'small'}
          disabled={busy}
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
        onChange={changePage} />
    </div>
    {
      busy ?
        <Spin />
        :
        <Input.TextArea
          style={{ flexGrow: '1', resize: 'none' }}
          disabled={history.length == 0}
          value={history[page - 1] || TRANSLATION_HINT}
        />}
  </div>
}

export default TranslationCard
