const { ipcRenderer } = require('electron');
import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Image, Input, Spin, Typography, Space } from 'antd';
import { DeleteOutlined, ScanOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import TranslationCard from './TranslationCard';
import RawTextCard from './RawTextCard';
import StickyText from './StickyText';

const EntryCard = ({ entry, config }) => {
  const [hideToolbar, setHideToolbar] = useState(false);
  const [minimizeToolbar, setMinimizeToolbar] = useState(false);

  const onDeleteEntry = (entryId) => {
    ipcRenderer.send('deleteEntry', entryId);
  };

  const onDeleteFromPreview = (sectionIndex) => {
    const payload = {
      entryId: entry.id,
      sectionId: entry.meta.sections[sectionIndex].id
    }
    ipcRenderer.send('deleteSection', payload);
  }

  const updateText = (id, updatedText) => {
    const textObj = { id: id, text: updatedText };
    ipcRenderer.send('updateEntryText', textObj);
  }

  const translateEntry = (id) => {
    ipcRenderer.send('translateEntry', id);
  }

  const scanEntry = (id) => {
    ipcRenderer.send('scanEntry', id);
  }

  const startTextCapture = (id) => {
    console.log('startTextCapture react');
    setHideToolbar(true);
    setTimeout(() => setHideToolbar(false), 1000);
    ipcRenderer.send('startTextCapture', id);
  }

  const onPreviewChange = (visible) => {
    console.log("Preview changed: ", visible);
    if (!visible) {
      ipcRenderer.send('stopTextCapture');
    }
  }

  const updateTextInPreview = (entryId, sectionIndex, updatedText) => {
    if (sectionIndex == 0) {
      updateText(entryId, updatedText);
    } else {
      entry.meta.sections[sectionIndex].text = updatedText;
      const textObj = {
        entryId,
        id: entry.meta.sections[sectionIndex - 1].id,
        text: updatedText
      }
      ipcRenderer.send('updateSectionText', textObj);
    }
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
            <Image.PreviewGroup items={[
              entry.img,
              ...entry.meta.sections.map(section => section.img)
            ]}
              preview={{
                minScale: 0,
                toolbarRender: (
                  _,
                  {
                    transform: { scale },
                    actions: { onZoomOut, onZoomIn },
                    current
                  }
                ) => {
                  if (minimizeToolbar) {
                    return <FullscreenOutlined 
                      style={{padding: "12px 12px", backgroundColor: "rgba(0, 0, 0, 0.4)", borderRadius: "12px"}}
                      onClick={() => setMinimizeToolbar(false)} 
                      />;
                  } else {
                    return (
                      <Space
                        direction='vertical'
                        className="toolbar-wrapper"
                        style={{ display: hideToolbar ? 'none' : null }}
                      >
                        <StickyText
                          className="preview-text"
                          value={current == 0 ? entry.text : entry.meta.sections[current - 1]?.text}
                          autoSize={{ maxRows: 10 }}
                          onChange={(event) => updateTextInPreview(entry.id, current, event.target.value)}
                        />
                        <Space size={12}>
                          <ScanOutlined onClick={() => startTextCapture(entry.id)} />
                          <ZoomOutOutlined onClick={onZoomOut} />
                          <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                          <DeleteOutlined disabled={current === 0} onClick={() => onDeleteFromPreview(current - 1)} />
                          <FullscreenExitOutlined onClick={() => setMinimizeToolbar(true)} />
                        </Space>
                      </Space>
                    )
                  }
                },
                imageRender: (original, { transform: { scale }, current }) => (
                  <div>
                    <p>{current == 0 ? "Full Panel" : `Dialog ${current}`}</p>
                    {original}
                  </div>
                ),
                onVisibleChange: onPreviewChange
              }}
            >
              <Image
                style={{ maxHeight: '300px' }}
                src={entry.img}

              />
            </Image.PreviewGroup>
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
            onChange={(updatedText) => updateText(entry.id, updatedText)}
            ocrCallback={() => scanEntry(entry.id)}
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
    </Card >
  );
};

export default EntryCard;
