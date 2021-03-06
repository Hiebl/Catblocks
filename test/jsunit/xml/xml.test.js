/**
 * @description xml tests
 */

const utils = require('../commonUtils');

/**
 * Tests if import and export of Blocks to xml format works
 */
describe('Export and Import XML files to workspace', () => {

  /**
   * Execute ones in this scope
   */
  beforeAll(async () => {
    await page.goto(`${SERVER}`, { waitUntil: 'domcontentloaded' });
  });

  /**
   * Run before each test in this scope
  */
  beforeEach(async () => {
    // clean workspace before each test
    await page.evaluate(() => {
      playgroundWS.clear();
    });
  });

  /**
   * Test if exported xml file from block matches with regex expresseion
   */
  test('Export xml for each block from toolbox', async () => {
    expect(await page.evaluate(() => {
      Object.keys(toolboxWS.blockDB_).forEach(blockName => {
        playgroundWS.newBlock(blockName);
        const xml = (Blockly.Xml.workspaceToDom(playgroundWS, true)).outerHTML;
        if (xml.match(/<xml>.*<block.*>.*<\/block><\/xml>/) === null) {
          return false;
        }
      });
      return true;
    })).toBeTruthy();
  });

  /**
   * Export/Import combination test for all blocks from toolbox
   */
  test('Export/Import combi test for each block from toolbox', async () => {
    expect(await page.evaluate(() => {
      let xmlStrings = {};

      // first get all xml strings for each block
      Object.keys(toolboxWS.blockDB_).forEach(blockName => {
        playgroundWS.newBlock(blockName);
        xmlStrings[blockName] = (Blockly.Xml.workspaceToDom(playgroundWS, true)).outerHTML;
        playgroundWS.clear();

        // check if they fitt your requiremets
        if (xmlStrings[blockName].match(/<xml>.*<block.*>.*<\/block><\/xml>/) === null) {
          return false;
        }
      });

      // Reimport them and check again
      Object.keys(xmlStrings).forEach(blockName => {
        playgroundWS.clear();
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xmlStrings[blockName]), playgroundWS);

        if (Object.keys(playgroundWS.blockDB_).length !== 1) {
         return false;
        }
      });

      return true;
    })).toBeTruthy();
  });
});