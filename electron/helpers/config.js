const Store = require('electron-store');

const store = new Store();

//Set the initial configurations
const defaultPrompt = 'Translate this text from Japanese to English:';

const defaultOpenAiModel = {
  name: 'GPT 3.5 Turbo 0301',
  fullname: 'gpt-3.5-turbo-0301',
  mode: 'chat',
  abbreviation: 'GPT-3.5-Tur',
};

const defaultConfigsValues = {
  basePrompt: defaultPrompt,
  screenshotModifierKey: 'Ctrl',
  screenshotLetterKey: 'T',
  basePromptOptions: [
    defaultPrompt,
    'Traduce este testo del Japones al Español:',
  ],
  openIaModels: [
    defaultOpenAiModel,
    {
      name: 'Davinci 003',
      fullname: 'text-davinci-003',
      mode: 'completion',
      abbreviation: 'Dav-3',
    },
  ],
  selectedOpenAiModel: defaultOpenAiModel.fullname,
};

//Performs an initial load of all settings when the program is first started
function checkInitialConfig() {
  const basePrompt = store.get('basePrompt');
  if (!basePrompt) {
    store.set('basePrompt', defaultConfigsValues.basePrompt);
  }

  const screenshotModifierKey = store.get('screenshotModifierKey');
  if (!screenshotModifierKey) {
    store.set(
      'screenshotModifierKey',
      defaultConfigsValues.screenshotModifierKey,
    );
  }

  const screenshotLetterKey = store.get('screenshotLetterKey');
  if (!screenshotLetterKey) {
    store.set('screenshotLetterKey', defaultConfigsValues.screenshotLetterKey);
  }

  const basePromptOptions = store.get('basePromptOptions');
  if (!basePromptOptions) {
    store.set('basePromptOptions', defaultConfigsValues.basePromptOptions);
  }

  const openIaModels = store.get('openIaModels');
  if (!openIaModels) {
    store.set('openIaModels', defaultConfigsValues.openIaModels);
  }

  const selectedOpenAiModel = store.get('selectedOpenAiModel');
  if (!selectedOpenAiModel) {
    store.set('selectedOpenAiModel', defaultConfigsValues.selectedOpenAiModel);
  }
}

//Retrieve all settings
function getFullConfigs() {
  return {
    openaiApiKey: store.get('openaiApiKey', ''),
    basePrompt: store.get('basePrompt'),
    screenshotModifierKey: store.get('screenshotModifierKey'),
    screenshotLetterKey: store.get('screenshotLetterKey'),
    basePromptOptions: store.get('basePromptOptions'),
    openIaModels: store.get('openIaModels'),
    selectedOpenAiModel: store.get('selectedOpenAiModel'),
  };
}

//Returns the configurations necessary for the Python backend to operate
function getQueryConfig() {
  return {
    openaiApiKey: store.get('openaiApiKey', ''), 
    basePrompt: store.get('basePrompt'),
    selectedOpenAiModel: getSelectedOpenAiModelProprieties(), 
  };
}

//Returns the screen capture shortcut configuration
function getShortcutConfig() {
  return {
    screenshotModifierKey: store.get('screenshotModifierKey'),
    screenshotLetterKey: store.get('screenshotLetterKey'),
  };
}

//Save updated configurations
//These must exist and must be different from the current settings
function saveConfig(newConfigs) {
  const currentsConfigs = getFullConfigs();

  //Allow the API key to be cleared
  if (newConfigs.openaiApiKey || newConfigs.openaiApiKey === '') {
    if (newConfigs.openaiApiKey !== currentsConfigs.openaiApiKey) {
      store.set('openaiApiKey', newConfigs.openaiApiKey);
    }
  }

  if (newConfigs.basePrompt) {
    if (newConfigs.basePrompt !== currentsConfigs.basePrompt) {
      store.set('basePrompt', newConfigs.basePrompt);
    }
  }

  if (newConfigs.screenshotModifierKey) {
    if (
      newConfigs.screenshotModifierKey !== currentsConfigs.screenshotModifierKey
    ) {
      store.set('screenshotModifierKey', newConfigs.screenshotModifierKey);
    }
  }

  if (newConfigs.screenshotLetterKey) {
    if (
      newConfigs.screenshotLetterKey !== currentsConfigs.screenshotLetterKey
    ) {
      store.set('screenshotLetterKey', newConfigs.screenshotLetterKey);
    }
  }

  if (newConfigs.selectedOpenAiModel) {
    if (
      newConfigs.selectedOpenAiModel !== currentsConfigs.selectedOpenAiModel
    ) {
      store.set('selectedOpenAiModel', newConfigs.selectedOpenAiModel);
    }
  }
}

//Reset the settings back to initial values
function resetConfig() {
  store.delete('openaiApiKey');
  store.set('basePrompt', defaultConfigsValues.basePrompt);
  store.set(
    'screenshotModifierKey',
    defaultConfigsValues.screenshotModifierKey,
  );
  store.set('screenshotLetterKey', defaultConfigsValues.screenshotLetterKey);
  store.set('basePromptOptions', defaultConfigsValues.basePromptOptions);
  store.set('openIaModels', defaultConfigsValues.openIaModels);
  store.set('selectedOpenAiModel', defaultConfigsValues.selectedOpenAiModel);
}

function getSelectedOpenAiModelProprieties() {
  return store
    .get('openIaModels')
    .find((e) => e.fullname === store.get('selectedOpenAiModel'));
}

//Reset the "first boot" option to go through the first boot process again.
function resetFirstInit() {
  store.set('firstInitReady', false);
}

function setFirstInitReady(status) {
  store.set('firstInitReady', status);
}

function getFirstInitReady() {
  return store.get('firstInitReady', false);
}

function setInitModelSequenceReady(status) {
  store.set('initModelSequenceReady', status);
}

function getInitModelSequenceReady() {
  return store.get('initModelSequenceReady', false);
}

module.exports = {
  checkInitialConfig,
  getFullConfigs,
  getQueryConfig,
  getShortcutConfig,
  saveConfig,
  resetConfig,
  resetFirstInit,
  setFirstInitReady,
  getFirstInitReady,
  setInitModelSequenceReady,
  getInitModelSequenceReady,
  getSelectedOpenAiModelProprieties,
};
