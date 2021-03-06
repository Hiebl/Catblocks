/**
 * @fileoverview Catblocks integrationt into Web utilities
 * @author andreas.karner@student.tugraz.at (Andreas Karner)
 */

import $ from 'jquery';


/**
 * Default options defined here
 * @enum {object}
 */
export const defaultOptions = {
  render: {
    container: 'body',
    language: 'en_GB',
    renderSize: 0.75,
    shareRoot: '',
    media: 'media/',
    noImageFound: 'No_Image_Available.jpg',
  },
  scene: {
    writeHeader: true,
    expandable: true
  },
  object: {
    writeHeader: true,
    writeStats: true,
    writeLook: true,
    expandable: true,
    programRoot: 'assets/extracted/dc7fb2eb-1733-11ea-8f2b-000c292a0f49/'
  }
};


/**
 * Parse options, if value exists in inputValues use this one
 * Otherwise go with the value from defaultValues
 * @param {Object} inputValues to use if exists
 * @param {Object} defaultValues to parse down
 * @return {Object} either input or default value
 */
export const parseOptions = (inputValues, defaultValues) => {
  return Object.assign({}, defaultValues, inputValues);
};


/**
 * Transform dom xml, execute actions define in options
 *  example value for tagActions parameter
 *  {
 *    'block': ['remAttr-id', 'remAttr-x', 'remAttr-y'],
 *    'shadow': ['remAttr-id', 'remAttr-x', 'remAttr-y']
 *   }
 *  this will remove the attributes [id, x, y] from all block and shadow nodes
 * @param {XMLDocument} xmlDom to transform
 * @param {object} tagActions to map against tag elements
 */
export const transformXml = (xmlDom, tagActions) => {
  Object.keys(tagActions).forEach(tagName => {
    xmlDom.getElementsByTagName(tagName).forEach(node => {
      tagActions[tagName].forEach(action => {
        const actionType = action.split('-')[0];
        const actionValue = action.split('-')[1];

        // INFO: please add new features as needed
        switch (actionType) {
        case 'remAttr': {
          node.removeAttribute(actionValue);
          break;
        }
        default: {
          console.warn("Ignore undefined XML transformation.");
        }
        }
      });
    });
  });
};

/**
 * Inject new dom into container with provided attributes and textContent is present
 * @param {Element} container dom where to injectAllScenes the new scene
 * @param {Object} tagName to injectAllScenes into container
 * @param {?Object<string, string>|?string} attributes attribute object or just class name
 * @param {?string} textContent to set for new dom element
 * @return {Element} new created subcontainer
 */
export const injectNewDom = (container, tagName, attributes, textContent) => {
  const subContainer = document.createElement(tagName);
  Object.keys(attributes).forEach(attrKey => {
    subContainer.setAttribute(attrKey, attributes[attrKey]);
  });
  if (typeof textContent !== 'undefined') {
    subContainer.textContent = textContent;
  }
  getDomElement(container).appendChild(subContainer);

  return subContainer;
};

/**
 * Wrap element into new element, type defined via wrapTag
 * Map all attributes to wrap element
 * @param {Element|string} element to wrap
 * @param {Object} wrapTag to wrap element into
 * @param {?Object} attributes map to wrapTag element
 * @return {Element} wrapped element and mapped attributes
 */
export const wrapElement = (element, wrapTag, attributes) => {
  const parent = document.createElement(wrapTag);
  if (attributes) {
    Object.keys(attributes).forEach(attrKey => {
      parent.setAttribute(attrKey, attributes[attrKey]);
    });
  }
  parent.appendChild(element.cloneNode(true));

  return parent;
};

/**
 * Remove all children from node
 * @param {Element} node 
 */
export const removeAllChildren = (node) => {
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
};

/**
 * Retrieve dom from document by id or class name
 * returns undefined in neither string or dom element
 * @param {string|Element} idName 
 * @param {Element?} ancestor to search from
 * @return {Element} dom element for name
 */
export const getDomElement = (name, ancestor) => {
  switch (typeof name) {
  case 'object': {
    return name;
  }
  case 'string': {
    if (typeof ancestor !== 'undefined') {
      return ancestor.querySelector(name);
    }
    return document.getElementById(name) ||
        document.querySelector(name);
  }
  default: {
    return undefined;
  }
  }
};

/**
 * Check if dom has children
 * @param {Element} element to check if has children
 * @return {Boolean} if has children
 */
export const hasChildren = (element) => {
  switch (element.toString()) {
  case '[object HTMLDivElement]': {
    return (element.children !== undefined && element.children.length > 0);
  }
  case '[object HTMLCollection]': {
    return element.length;
  }
  case '[object XMLDocument]': {
    return element.childElementCount;
  }
  default: {
    return element.children.length || element.hasChildNodes() || element.firstChild;
  }
  }
};

/**
 * Enable expandable
 * @param {*} node node to expand on trigger click
 * @param {*} trigger trigger to expand node
 */
export const enableExpandable = (node, trigger) => {
  // TODO: use jquery, need to fix displaying issues with max-heigth later
  $(node).css('display', 'none');
  $(node).addClass('container-closed');

  $(trigger).click(() => {
    if ($(node).hasClass('container-closed')) {
      $(node).slideDown();
      $(node).removeClass('container-closed');
    } else {
      $(node).slideUp();
      $(node).addClass('container-closed');
    }
  });
};

/**
 * Trim string is longer than length and add ...
 * @param {*} str to trim
 * @param {*} length if longer than
 * @return {string} prepared string
 */
export const trimString = (str, length = 15) => {
  if (typeof str === 'string') {
    if (str.length > length) {
      return `${str.slice(0, length)}...`;
    }
    return str;
  }
  return undefined;
};

export const checkNextBlock = (array) => {

  for(let i = 0; i < array.length; i++) {
    if(array[i].childBlocks_.length > 0) {
      for(let j = 0; j < array[i].childBlocks_.length; j++) {
        if(array[i].colour_ === array[i].childBlocks_[j].colour_) {
          array[i].childBlocks_[j].colour_ = array[i].childBlocks_[j].colourTertiary_;
          array[i].childBlocks_[j].initSvg();
        }
        checkNextBlock(array[i].childBlocks_);
      }
    }
  }
};