const { ipcRenderer, nativeImage } = require('electron');
import React, { useState, useRef } from 'react';
import { Button, Card, Row, Col, Image, Input, Select, Space, Divider } from 'antd';
import { DeleteOutlined, ScanOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, FullscreenExitOutlined, PlusOutlined, TranslationOutlined } from '@ant-design/icons';
import TranslationCard from './TranslationCard';
import RawTextCard from './RawTextCard';
import StickyText from './StickyText';

const EntryCard = ({ entry, config }) => {
  const [hideToolbar, setHideToolbar] = useState(false);
  const [minimizeToolbar, setMinimizeToolbar] = useState(false);
  const [actorName, setActorName] = useState('');
  const [actorNames, setActorNames] = useState([...entry.meta.actors]);
  const [selectedActors, setSelectedActors] = useState([...entry.meta.actors]);
  const inputRef = useRef(null);

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

  const onActorNameChange = (event) => {
    setActorName(event.target.value);
  };

  const addActorName = (e) => {
    e.preventDefault();
    setActorNames([...actorNames, actorName || `Actor ${actorNames.length + 1}`]);
    setActorName('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const onChooseActor = (e) => {
    const newSelectedActors = [...selectedActors, e];
    setSelectedActors(newSelectedActors);
    ipcRenderer.send('setSelectedActors', {entryId:entry.id, actors:newSelectedActors})
  }

  const onRemoveActor = (e) => {
    const index = selectedActors.findIndex(name => name === e);
    if(index >= 0) {
      const newSelectedActors = [...selectedActors]
      newSelectedActors.splice(index, 1);
      setSelectedActors(newSelectedActors);
      ipcRenderer.send('setSelectedActors', {entryId:entry.id, actors:newSelectedActors})
    }
  }

  const onTranslate = (entryId, sectionIndex) => {
    if(sectionIndex > 0) {
      const section = entry.meta.sections[sectionIndex-1];
      console.log("The current text is ", section.text);

      //Resize image to 256x256
      const image = document.createElement('img');
      image.src = section.img;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false});
      canvas.width = 256;
      canvas.height = 256;
      ctx.drawImage(image, 0, 0, 256, 256);
      const dataUrl = canvas.toDataURL();
      console.log("The resized image is ", dataUrl);

      //Center-crop image at 224 x 224
      const croppedData = ctx.getImageData(16,16,224,224);

      //Extract from resized canvas
      ctx.height = 224;
      ctx.width = 224;
      canvas.height = 224;
      canvas.width = 224;
      ctx.putImageData(croppedData, 0, 0);
      const croppedUrl = canvas.toDataURL();
      console.log("The cropped image is ", croppedUrl);
      
      //Remove alpha channel
      let tensorData = croppedData.data.filter((_, index) => (index + 1) % 4);

      //Align data according to channel
      // const roffset = 0;        //0-50175
      // const goffset = 224*224;  //50176-100351
      // const boffset = 2*224*224 //100352-150527

      // for(let i = 0; i < tensorData.length/3; i+=3) {
      //   const redSectorGreen = tensorData[i+1];
      //   const redSectorBlue = tensorData[i+2];
      //   const greenSectorRed = tensorData[goffset+i];
      //   const blueSectorRed = tensorData[boffset+i];

      //   tensorData[i+1] = greenSectorRed;
      //   tensorData[i+2] = blueSectorRed;
      //   tensorData[goffset+i] = redSectorGreen;
      //   tensorData[goffset+i] = redSectorBlue;
      // }

      const r = [];
      const g = [];
      const b = [];
      const normalize = v => ((v / 255) * 2) - 1;
      for(let i = 0; i < tensorData.length; i+=3) {
        r.push(normalize(tensorData[i]));
        g.push(normalize(tensorData[i+1]));
        b.push(normalize(tensorData[i+2]));
      }
      tensorData = [...r, ...g, ...b];
      
      //Normalization from Transformer: image = (image - image_mean) / image_std
      //image_mean is 0.5, image_std is 0.5
      tensorData = new Float32Array(tensorData);
      console.log("The cropped data is ", tensorData);

      
      ipcRenderer.send("localTranslate", {entryId: entryId, sectionId: section.id, tensorData: tensorData});
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
                          <TranslationOutlined onClick={() => onTranslate(entry.id, current)} disabled={current === 0} />
                          <Select
                            popupClassName='preview-popup'
                            style={{ width: 300 }}
                            placeholder="Actor 1"
                            mode='multiple'
                            defaultValue={selectedActors}
                            dropdownRender={(menu) => (
                              <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <Space style={{ padding: '0 8px 4px' }}>
                                  <Input
                                    placeholder="Hero speaks"
                                    ref={inputRef}
                                    value={actorName}
                                    onChange={onActorNameChange}
                                  />
                                  <Button type="text" icon={<PlusOutlined />} onClick={addActorName}>
                                    Add item
                                  </Button>
                                </Space>
                              </>
                            )}
                            options={actorNames.map((name) => {
                              const index = selectedActors.indexOf(name) + 1;
                              return ({ label: index > 0 ? index + "-" + name : name, value: name }) 
                            })}
                            onSelect={onChooseActor}
                            onDeselect={onRemoveActor}
                          />
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
