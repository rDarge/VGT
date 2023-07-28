import React, { useState, useEffect } from 'react';
import { Input } from 'antd';

/**
 * This component allows for a better UX for editing linked text
 * You can edit this text without your caret being bounced around with every insertion
 */
const StickyText = ({ value, onChange, className, autoSize }) => {
  const [localText, setLocalText] = useState(value);

  useEffect(() => {
    if (value) {
      setLocalText(value);
    }
  }, [value]);

  const updateText = (event) => {
    setLocalText(event.target.value);
    onChange(event);
  }

  return (
    <Input.TextArea
      className={className}
      style={{ flexGrow: '1', resize: 'none' }}
      value={localText}
      autoSize={autoSize}
      onChange={updateText}
    />
  );
}

export default StickyText