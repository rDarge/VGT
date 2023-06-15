const { ipcRenderer } = require('electron');
import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Image, Input, Spin, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import TranslationCard from './TranslationCard';

const EntryCard = ({ entry }) => {
  const [text, setText] = useState(entry.text);

  useEffect(() => {
    setText(entry.text);
  }, [entry.text]);

  const onDeleteEntry = (entryId) => {
    ipcRenderer.send('deleteEntry', entryId);
  };

  const updateEntryText = (event) => {
    setText(event.target.value);
    const textObj = { id: entry.id, text: event.target.value };
    ipcRenderer.send('updateEntryText', textObj);
  }

  const translateEntry = (id) => {
    ipcRenderer.send('translateEntry', id);
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
            <TranslationCard 
              translation={entry.trad} 
              modelLabel={entry.selectedModel.abbreviation}
              translateCallback={() => translateEntry(entry.id)} 
            />
        </Col>
      </Row>
    </Card>
  );
};

export default EntryCard;
