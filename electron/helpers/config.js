const Store = require('electron-store');

const store = new Store();

const defaultPrompts = [
  { label: 'JP→EN', text: 'Translate this text from Japanese to English:' },
  { label: 'JP→ES', text: 'Traduce este testo del Japones al Español:' },
  { label: 'Kana', text: 'What are the kana for the following words:' },
  { label: 'X→字', text: 'Can you determine what the missing kanji (represented by X) are in the following text:' },
  { label: 'Kanji', text: 'Can you define each of the kanji words used in the following:' },
]

const defaultOCRModes = [
  'mangaOCR',
  'winOCR'
]

const languages = [
  {
    label: 'English',
    target: 'English',
    winOCR: 'en'
  }, {
    label: 'Japanese',
    target: 'Japanese',
    winOCR: 'ja'
  }
];

//Set the initial configurations
const defaultPrompt = 'Translate this text from Japanese to English:';

const defaultOpenAiModels = [
  {
    name: 'GPT 3.5 Turbo',
    fullname: 'gpt-3.5-turbo',
    mode: 'chat',
    abbreviation: 'GPT-3.5-Tur',
  },
  {
    name: 'Davinci 003',
    fullname: 'text-davinci-003',
    mode: 'completion',
    abbreviation: 'Dav-3',
  }
];

const defaultConfigsValues = {
  basePrompt: defaultPrompt,
  screenshotModifierKey: 'Ctrl',
  screenshotLetterKey: 'T',
  prompts: [...defaultPrompts],
  openAiModels: [...defaultOpenAiModels],
  ocrModes: defaultOCRModes,
  selectedOpenAiModel: defaultOpenAiModels[0].fullname,
  selectedOcrMode: defaultOCRModes[0],
  sourceLanguage: languages[1],
};

//Performs an initial load of all settings when the program is first started
function checkInitialConfig() {
  const basePrompt = store.get('basePrompt');
  if (!basePrompt) {
    store.set('basePrompt', defaultConfigsValues.basePrompt);
  }

  const prompts = store.get('prompts');
  if (!prompts) {
    store.set('prompts', defaultConfigsValues.prompts);
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

  const openAiModels = store.get('openAiModels');
  if (!openAiModels) {
    store.set('openAiModels', defaultConfigsValues.openAiModels);
  }

  const selectedOpenAiModel = store.get('selectedOpenAiModel');
  if (!selectedOpenAiModel) {
    store.set('selectedOpenAiModel', defaultConfigsValues.selectedOpenAiModel);
  }

  const selectedOcrMode = store.get('selectedOcrMode');
  if (!selectedOcrMode) {
    store.set('selectedOcrMode', defaultConfigsValues.selectedOcrMode);
  }

  const sourceLanguage = store.get('sourceLanguage');
  if (!sourceLanguage) {
    store.set('sourceLanguage', defaultConfigsValues.sourceLanguage);
  }
}

//Retrieve all settings
function getFullConfigs() {
  return {
    openaiApiKey: store.get('openaiApiKey', ''),
    basePrompt: store.get('basePrompt'),
    screenshotModifierKey: store.get('screenshotModifierKey'),
    screenshotLetterKey: store.get('screenshotLetterKey'),
    prompts: store.get('prompts'),
    openAiModels: store.get('openAiModels'),
    selectedOpenAiModel: store.get('selectedOpenAiModel'),
    selectedOcrMode: store.get('selectedOcrMode'),
    sourceLanguage: store.get('sourceLanguage'),
  };
}

//Returns the configurations necessary for the Python backend to operate
function getQueryConfig() {
  return {
    openaiApiKey: store.get('openaiApiKey', ''),
    basePrompt: store.get('basePrompt'),
    selectedOpenAiModel: getSelectedOpenAiModelProprieties(),
    selectedOcrMode: store.get('selectedOcrMode'),
    sourceLanguage: store.get('sourceLanguage')
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
function saveConfig(updated) {
  const current = getFullConfigs();

  const propertiesToUpdate = [
    'basePrompt',
    'screenshotModifierKey',
    'screenshotLetterKey',
    'selectedOpenAiModel',
    'selectedOcrMode',
    'sourceLanguage'
  ]
  propertiesToUpdate.forEach((property) => {
    const newValue = updated[property];
    if (newValue && newValue !== current[property]) {
      store.set(property, newValue);
    }
  });

  //Allow the API key to be cleared
  if (updated.openaiApiKey || updated.openaiApiKey === '') {
    if (updated.openaiApiKey !== current.openaiApiKey) {
      store.set('openaiApiKey', updated.openaiApiKey);
    }
  }

  if (updated.prompts) {
    if (updated.prompts.length > 0) {
      store.set('prompts', updated.prompts);
    }
  }
}

//Reset the settings back to initial values
function resetConfig() {
  store.delete('openaiApiKey');
  store.set('basePrompt', defaultConfigsValues.basePrompt);
  store.set('screenshotModifierKey', defaultConfigsValues.screenshotModifierKey);
  store.set('screenshotLetterKey', defaultConfigsValues.screenshotLetterKey);
  store.set('prompts', defaultConfigsValues.prompts);
  store.set('openAiModels', defaultConfigsValues.openAiModels);
  store.set('selectedOpenAiModel', defaultConfigsValues.selectedOpenAiModel);
  store.set('selectedOcrMode', defaultConfigsValues.selectedOcrMode);
  store.set('sourceLanguage', defaultConfigsValues.sourceLanguage);
}

function getSelectedOpenAiModelProprieties() {
  return store
    .get('openAiModels')
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
