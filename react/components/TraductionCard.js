const { ipcRenderer } = require('electron');
import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Image, Input, Spin, Typography } from 'antd';
import { DeleteOutlined, RedoOutlined } from '@ant-design/icons';

const TraductionCard = ({ entry }) => {
  const [text, setText] = useState(entry.text);

  useEffect(() => {
    setText(entry.text);
  }, [entry.text])

  const onDeleteEntry = (entryId) => {
    ipcRenderer.send('deleteEntry', entryId);
  };

  const onRedoEntry = (entryId) => {
    ipcRenderer.send('redoEntry', entryId);
  };

  const updateEntryText = (event) => {
    setText(event.target.value);
    ipcRenderer.send('updateEntryText', {id: entry.id, text:event.target.value});
  }

  return (
    <Card
      bordered={false}
      style={{ height: '130px' }}
      bodyStyle={{ height: '100%', padding: '10px' }}
    >
      <Row gutter={10} style={{ height: '100%' }}>
        <Col
          span={1}
          style={{
            display: 'flex',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Button
              danger
              shape="circle"
              size={'small'}
              onClick={() => onDeleteEntry(entry.id)}
              icon={<DeleteOutlined style={{ fontSize: '14px' }} />}
            />
          </div>
        </Col>
        <Col
          span={7}
          style={{
            display: 'flex',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              justifyContent: 'center',
              background: 'rgb(128 128 128)',
              borderRadius: '10px',
            }}
          >
            <Image style={{ maxHeight: '105px' }} src={entry.img} />
          </div>
        </Col>
        <Col
          span={8}
          style={{
            display: 'flex',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
              Raw text{' '}
              <Typography.Text
                code
                style={{ fontSize: '10px', verticalAlign: 'text-bottom' }}
              >
                (Manga-OCR)
              </Typography.Text>
            </div>
            {entry.text ? (
              <Input.TextArea
                style={{ flexGrow: '1', resize: 'none' }}
                value={text}
                onChange={updateEntryText}
              />
            ) : (
              <Spin />
            )}
          </div>
        </Col>
        <Col span={8} style={{ display: 'flex', height: '100%' }}>
          <div
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
                {entry.selectedModel.abbreviation}
              </Typography.Text>
              <Button
                shape="circle"
                size={'small'}
                onClick={() => onRedoEntry(entry.id)}
                icon={<RedoOutlined style={{ fontSize: '14px' }} />}
              />
            </div>
            {entry.trad ? (
              <Input.TextArea
                style={{ flexGrow: '1', resize: 'none' }}
                value={entry.trad}
              />
            ) : (
              <Spin />
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default TraductionCard;
