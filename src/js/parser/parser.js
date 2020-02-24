class Scene {
  constructor(name) {
    this.name = name;
    this.objectList = [];
  }
}

class Object {
  constructor(name) {
    this.name = name;
    this.lookList = [];
    this.soundList = [];
    this.scriptList = [];
  }
}

class File {
  constructor(name, fileName) {
    this.name = name;
    this.fileName = fileName;
  }
}

class Script {
  constructor(name) {
    this.name = name;
    this.brickList = [];
    this.formValues = new Map();
  }
}

class Brick {
  constructor(name) {
    this.name = name;
    this.loopOrIfBrickList = [];
    this.elseBrickList = [];
    this.formValues = new Map();
  }
}

class Formula {
  constructor() {
    this.value = "";
    this.left = null;
    this.right = null;
  }
  setLeft(leftBlock) {
    if (this.left === null) {
      this.left = leftBlock;
    }
    else {
      this.left.setLeft(leftBlock);
    }
  }
  setRight(rightBlock) {
    if (this.right === null) {
      this.right = rightBlock;
    }
    else {
      this.right.setRight(rightBlock);
    }
  }
}

const sceneList = [];
let xmlDoc = undefined;
const supportedAppVersion = 0.994;

const XML_BEGIN = "<xml xmlns=\"http://www.w3.org/1999/xhtml\">";
const XML_END = "\n</xml>";
const NEXT_BEGIN = "\n<next>";
const NEXT_END = "\n</next>";
const SUB1_BEGIN = "\n<statement name=\"SUBSTACK\">";
const SUB2_BEGIN = "\n<statement name=\"SUBSTACK2\">";
const SUB_END = "\n</statement>";

let XML = "";// XML_BEGIN;
let share = 0;

// global log enable switch
const DEBUG = true;

/**
 * Catblocks debug function
 * @param {*} msg 
 * @param {*} debug 
 */
const catLog = (msg, debug = DEBUG) => {
  if (debug) {
    console.log(msg);
  }
};

/**
 * Check if current catroid code version is supported
 * @param {XMLDocument} program to validate
 * @return {boolean} if supported or not
 */
function isSupported(program = xmlDoc) {
  const appVersion = program.getElementsByTagName('catrobatLanguageVersion');
  if (appVersion === undefined || appVersion.length < 1) {
    console.warn('Catblocks tries to render unsupported application version, some issues could occur.');
    return false;
  }
  if (appVersion[0].innerHTML < supportedAppVersion) {
    console.warn('Catblocks tries to render unsupported application version, some issues could occur.');
    return false;
  }
  return true;
}

/**
 * Parse XMLDocument from catroid code to catblocks
 * @param {XMLDocument} xml catroid program xml
 * @return {XMLDocument} catblocks format
 */
function parseDocument(xml) {
  // clear result array
  sceneList.length = 0;
  xmlDoc = xml;

  // TODO: add code if not supported
  if (!isSupported()) {
    return undefined;
  }

  const scenes = xml.getElementsByTagName('scenes')[0].children;
  for (let i = 0; i < scenes.length; i++) {
    sceneList.push(parseScenes(scenes[i]));
  }
  // console.log(sceneList);
  const xmlStream = writeXML();
  // console.log(xmlStream);
  return (new DOMParser()).parseFromString(xmlStream, 'text/xml');
}

function flatReference(node, xml = xmlDoc) {
  const refPath = node.getAttribute('reference');
  if (refPath) {
    return xml.evaluate(refPath, node, null, XPathResult.ANY_TYPE, null).iterateNext();
  }
  return node;
}

/**
 * Escape not allowed characters in names
 * @param {string} name to escape
 * @returns {string} proper value
 */
function escapeName(name) {
  return (name || '').replace(/[&]/, '');
}

function parseScenes(scene) {
  catLog(scene);

  const name = escapeName(scene.getElementsByTagName("name")[0].childNodes[0].nodeValue);
  const currentScene = new Scene(name);
  const objectList = scene.getElementsByTagName('objectList')[0].children;
  for (let i = 0; i < objectList.length; i++) {
    currentScene.objectList.push(parseObjects(objectList[i]));
  }
  return currentScene;
}

function parseObjects(object) {
  object = flatReference(object);
  catLog(object);

  const name = escapeName(object.getAttribute("name"));
  if (name !== null) {
    const currentObject = new Object(name);
    const lookList = object.getElementsByTagName('lookList')[0].children;
    const soundList = object.getElementsByTagName('soundList')[0].children;
    const scriptList = object.getElementsByTagName('scriptList')[0].children;

    for (let i = 0; i < lookList.length; i++) {
      currentObject.lookList.push(new File(lookList[i].getAttribute("name"), lookList[i].getAttribute("fileName")));
    }
    for (let i = 0; i < soundList.length; i++) {
      currentObject.soundList.push(new File(soundList[i].getAttribute("name"), soundList[i].getAttribute("fileName")));
    }
    for (let i = 0; i < scriptList.length; i++) {
      currentObject.scriptList.push(parseScripts(scriptList[i]));
    }
    return currentObject;
  }
}

function parseScripts(script) {
  catLog(script);

  const name = escapeName(script.getAttribute("type"));
  const currentScript = new Script(name);
  const brickList = script.getElementsByTagName('brickList')[0].children;
  for (let i = 0; i < script.childNodes.length; i++) {
    checkUsage(script.childNodes[i], currentScript);
  }

  for (let i = 0; i < brickList.length; i++) {
    currentScript.brickList.push(parseBrick(brickList[i]));
  }
  return currentScript;
}

function parseBrick(brick) {
  catLog(brick);

  const name = (brick.getAttribute("type") || 'emptyBlockName').match(/[a-zA-Z]+/)[0];
  const currentBrick = new Brick(name);

  for (let i = 0; i < brick.childNodes.length; i++) {
    checkUsage(brick.childNodes[i], currentBrick);
  }
  return currentBrick;
}

const getNodeValueOrDefault = (node, def = "---") => {
  if (node === undefined || node.nodeValue === undefined) {
    return def;
  }
  return node.nodeValue;
};

function checkUsage(list, location) {
  if (list.nodeName === "broadcastMessage" || list.nodeName === "spriteToBounceOffName" || list.nodeName === "receivedMessage" || list.nodeName === "sceneToStart" || list.nodeName === "sceneForTransition") {
    // BLOCKS-54 -> sceneForTransition can exist without node child
    location.formValues.set("DROPDOWN", getNodeValueOrDefault(list.childNodes[0]));
  }
  if (list.nodeName === "spinnerSelection") {
    location.formValues.set("spinnerSelection", getNodeValueOrDefault(list.childNodes[0]));
  }
  if (list.nodeName === "selection") {
    location.formValues.set("selection", getNodeValueOrDefault(list.childNodes[0]));
  }
  if (list.nodeName === "type") {
    location.formValues.set("type", getNodeValueOrDefault(list.childNodes[0]));
  }
  if (list.nodeName === "alignmentSelection") {
    location.formValues.set("alignmentSelection", getNodeValueOrDefault(list.childNodes[0]));
  }
  if (list.nodeName === "spinnerSelectionID") {
    location.formValues.set("spinnerSelectionID", getNodeValueOrDefault(list.childNodes[0]));
  }
  if (list.nodeName === "formulaMap" || list.nodeName === "formulaList") {
    const formulaList = list.children;
    for (let j = 0; j < formulaList.length; j++) {
      const formula = new Formula();
      workFormula(formula, formulaList[j]);
      const attribute = formulaList[j].getAttribute("category");
      location.formValues.set(attribute, concatFormula(formula, ""));
    }
  }
  if (list.nodeName === "ifBranchBricks" || list.nodeName === "loopBricks") {
    const loopOrIfBrickList = (list.children);
    for (let j = 0; j < loopOrIfBrickList.length; j++) {
      location.loopOrIfBrickList.push(parseBrick(loopOrIfBrickList[j]));
    }
  }
  if (list.nodeName === "elseBranchBricks") {
    const elseBrickList = (list.children);
    for (let j = 0; j < elseBrickList.length; j++) {
      location.elseBrickList.push(parseBrick(elseBrickList[j]));
    }
  }
  if (list.nodeName === "sound") {
    const sound = flatReference(list);
    const soundName = sound.getAttribute('name');
    location.formValues.set("sound", soundName);
  }
  if (list.nodeName === "look") {
    const look = flatReference(list);
    const lookName = look.getAttribute('name');
    location.formValues.set("look", lookName);
  }
  if (list.nodeName === "userVariable") {
    if (list.childNodes.length !== 0) {
      findCurrentVariableName(list, location);
    }
    else {
      const reference = list.getAttribute("reference");
      findOtherVariableName(list, location, reference);

    }

  }
}

function findCurrentVariableName(list, location) {
  for (let i = 0; i < list.childNodes.length; i++) {
    if (list.childNodes[i].nodeName === "userVariable") {
      const userVariable = list.childNodes[i];
      for (let j = 0; j < userVariable.childNodes.length; j++) {
        if (userVariable.childNodes[j].nodeName === "default") {
          const defaultBlock = userVariable.childNodes[j];
          for (let k = 0; k < defaultBlock.childNodes.length; k++) {
            if (defaultBlock.childNodes[k].nodeName === "name") {
              location.formValues.set("DROPDOWN", defaultBlock.childNodes[k].textContent);
            }
          }
        }
      }
    }
  }
}

function findOtherVariableName(list, location, reference) {
  if (reference.startsWith("../")) {
    reference = reference.slice(3);
    findOtherVariableName(list.parentElement, location, reference);
  }
  else if (reference.startsWith("userVariable")) {
    for (let i = 0; i < list.childNodes.length; i++) {
      if (list.childNodes[i].nodeName === "userVariable") {
        findCurrentVariableName(list.childNodes[i], location);
      }
    }
  } else if (reference.startsWith("ifBranchBricks")) {
    reference = reference.slice(20);
    let position = 1;
    if (reference.startsWith("[")) {
      position = reference.charAt(1);
      reference = reference.slice(3);
    }
    reference = reference.slice(1);
    for (let i = 0; i < list.childNodes.length; i++) {
      if (list.childNodes[i].nodeName === "ifBranchBricks") {
        list = list.childNodes[i].childNodes[(position * 2) - 1];
        findOtherVariableName(list, location, reference);
      }
    }
  } else if (reference.startsWith("elseBranchBricks")) {
    reference = reference.slice(22);
    let position = 1;
    if (reference.startsWith("[")) {
      position = reference.charAt(1);
      reference = reference.slice(3);
    }
    reference = reference.slice(1);
    for (let i = 0; i < list.childNodes.length; i++) {
      if (list.childNodes[i].nodeName === "elseBranchBricks") {
        list = list.childNodes[i].childNodes[(position * 2) - 1];
        findOtherVariableName(list, location, reference);
      }
    }
  } else if (reference.startsWith("script")) {
    reference = reference.slice(6);
    let position = 1;
    if (reference.startsWith("[")) {
      position = reference.charAt(1);
      reference = reference.slice(3);
    }
    reference = reference.slice(1);
    findOtherVariableName(list.childNodes[(position * 2) - 1], location, reference);


  } else if (reference.startsWith("brickList")) {
    reference = reference.slice(15);
    let position = 1;
    if (reference.startsWith("[")) {
      position = reference.charAt(1);
      reference = reference.slice(3);
    }
    reference = reference.slice(1);
    for (let i = 0; i < list.childNodes.length; i++) {
      if (list.childNodes[i].nodeName === "brickList") {
        list = list.childNodes[i].childNodes[(position * 2) - 1];
        findOtherVariableName(list, location, reference);
      }
    }
  }
}

function workFormula(formula, input) {
  for (let i = 0; i < input.childNodes.length; i++) {
    if (input.childNodes[i].nodeName === "leftChild") {
      const newFormula = new Formula();
      formula.setLeft(newFormula);
      workFormula(newFormula, input.childNodes[i]);
    }
    if (input.childNodes[i].nodeName === "rightChild") {
      const newFormula = new Formula();
      formula.setRight(newFormula);
      workFormula(newFormula, input.childNodes[i]);
    }
    if (input.childNodes[i].nodeName === "value") {
      formula.value = (input.childNodes[i].childNodes[0]) ? input.childNodes[i].childNodes[0].nodeValue : 'not-set';
    }
  }
}

function concatFormula(formula, str) {
  if (formula.left !== null) {
    str = concatFormula(formula.left, str);
  }
  //Manage Operators & language strings
  str += formula.value;
  str += " ";
  if (formula.right !== null) {
    str = concatFormula(formula.right, str);
  }
  return str;
}

function writeXML() {
  if (share === 1) {
    XML = XML_BEGIN;
  }
  for (let i = 0; i < sceneList.length; i++) {
    if (share === 1) {
      XML = XML.concat(`<scene type="${sceneList[i].name}">`);
    }
    const currObjectList = sceneList[i].objectList;
    for (let j = 0; j < currObjectList.length; j++) {
      if (currObjectList[j].lookList.length > 0) {
        const objectImage = currObjectList[j].lookList[0].fileName;
        if (share === 1) {
          XML = XML.concat(`<object type="${currObjectList[j].name}" look="${objectImage}">`);
        }
      } else {
        if (share === 1) {
          XML = XML.concat(`<object type="${currObjectList[j].name}">`);
        }
      }
      const currScriptList = currObjectList[j].scriptList;
      for (let k = 0; k < currScriptList.length; k++) {
        XML = XML.concat(`<script type="${currScriptList[k].name}">`);
        writeScriptsToXML(currScriptList[k]);
        XML = XML.concat(`</script>`);
      }
      if (share === 1) {
        XML = XML.concat(`</object>`);
      }
    }
    if (share === 1) {
      XML = XML.concat(`</scene>`);
    }
  }
  if (share === 1) {
    XML = XML.concat(XML_END);
  }
  return XML;
}

function writeScriptsToXML(currScript) {
  XML = XML.concat("\n<block type=\"" + currScript.name + "\" id=\"\" x=\"\" y=\"\">");
  for (const [key, value] of currScript.formValues) {
    XML = XML.concat("\n<field name=\"" + key + "\">" + value + "</field>");
  }
  if (currScript.brickList.length !== 0) {
    writeBrickToXML(currScript, 0, true, 0);
  }
  XML = XML.concat("\n</block>");
}


function writeBrickToXML(currBrick, index, nextBrick, subBlock) {
  if (nextBrick === true) {
    XML = XML.concat(NEXT_BEGIN);
  }
  let currSubBrick;
  if (subBlock === 0) {
    currSubBrick = currBrick.brickList[index];
  }
  if (subBlock === 1) {
    currSubBrick = currBrick.loopOrIfBrickList[index];
  }
  if (subBlock === 2) {
    currSubBrick = currBrick.elseBrickList[index];
  }
  XML = XML.concat("\n<block type=\"" + currSubBrick.name + "\" id=\"\" x=\"\" y=\"\">");

  for (const [key, value] of currSubBrick.formValues) {
    XML = XML.concat("\n<field name=\"" + key + "\">" + value + "</field>");
  }
  if (currSubBrick.loopOrIfBrickList.length !== 0) {
    XML = XML.concat(SUB1_BEGIN);
    writeBrickToXML(currSubBrick, 0, false, 1);
    XML = XML.concat(SUB_END);
  }
  if (currSubBrick.elseBrickList.length !== 0) {
    XML = XML.concat(SUB2_BEGIN);
    writeBrickToXML(currSubBrick, 0, false, 2);
    XML = XML.concat(SUB_END);
  }
  if (subBlock === 0 && (currBrick.brickList.length > index + 1)) {
    writeBrickToXML(currBrick, index + 1, true, 0);
  }
  if (subBlock === 1 && (currBrick.loopOrIfBrickList.length > index + 1)) {
    writeBrickToXML(currBrick, index + 1, true, 1);
  }
  if (subBlock === 2 && (currBrick.elseBrickList.length > index + 1)) {
    writeBrickToXML(currBrick, index + 1, true, 2);
  }
  XML = XML.concat("\n</block>");
  if (nextBrick === true) {
    XML = XML.concat(NEXT_END);
  }
}

/**
 * Default export Parser class
 * Only those methodes are visible outside this module
 */
export default class Parser {

  /**
	 * Parse xmlString from catroid to catblocks format
	 * @param {string|Element} xmlString catroid string or XMLDocument 
	 * @returns {XMLDocument} catblock XMLDocument
	 */
  static parseXml(xmlString) {
    if (typeof xmlString === 'string') {
      return parseDocument((new window.DOMParser()).parseFromString(xmlString, 'text/xml'));
    }
    return parseDocument(xmlString);
  }

  /**
	 * Fetch and parse xml file defined via uri
	 * @param {*} xmlFile uri to catroid file
	 * @returns {Promise} catblock XMLDocument
	 */
  static parseFile(uri) {
    share = 1;
    return fetch(uri)
      .then(res => res.text())
      .then(str => {
        return Parser.parseXml(str);
      })
      .catch(err => {
        console.error(`Failed to fetch uri: ${uri}`);
        console.error(err);
        return undefined;
      });
  }
}