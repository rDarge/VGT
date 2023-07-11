const { ipcRenderer } = require('electron');
import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Image, Input, Spin, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import TranslationCard from './TranslationCard';
import RawTextCard from './RawTextCard';

const EntryCard = ({ entry, config }) => {
  
  const onDeleteEntry = (entryId) => {
    ipcRenderer.send('deleteEntry', entryId);
  };

  const updateText = (id, updatedText) => {
    const textObj = { id: id, text: updatedText };
    ipcRenderer.send('updateEntryText', textObj);
  }

  const translateEntry = (id) => {
    ipcRenderer.send('translateEntry', id);
  }

  return (
    <Card
      bordered={false}
      style={{ maxHeight: '350px' }}
      bodyStyle={{ maxHeight: '100%', padding: '10px' }}
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
            <Image style={{ maxHeight: '300px' }} src={entry.img} />
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
          <RawTextCard
            text={entry.text}
            onChange={(updatedText)=>updateText(entry.id, updatedText)}
            ocrCallback={() => ocrEntry(entry.id)}
            config={config}
          />
        </Col>
        <Col span={8} style={{ display: 'flex', height: '100%' }}>
          <TranslationCard
            translation={entry.trad}
            translateCallback={() => translateEntry(entry.id)}
            config={config}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default EntryCard;
