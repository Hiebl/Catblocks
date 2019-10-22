'use strict';

goog.provide('Blockly.Blocks.control');

goog.require('Blockly.Blocks');
goog.require('Blockly.Colours');
goog.require('Blockly.ScratchBlocks.VerticalExtensions');

Blockly.Blocks['ArduinoSendDigitalValueBrick'] = {
  init: function() {
    this.jsonInit({
      "message0": Blockly.Msg.ARDUINO_SENDDIGITALVALUE,
      "args0": [
        {
          "type": "input_value",
          "name": "DIGITAL_PIN"
        },
        {
          "type": "input_value",
          "name": "DIGITAL_PIN_VALUE"
        }
      ],
      "category": Blockly.Categories.arduino,
      "extensions": ["colours_arduino", "shape_statement"]
    });
  }
};


Blockly.Blocks['ArduinoSendPWMValueBrick'] = {
  init: function() {
    this.jsonInit({
      "message0": Blockly.Msg.ARDUINO_SENDPWMALVALUE,
      "args0": [
        {
          "type": "input_value",
          "name": "PWM_PIN"
        },
        {
          "type": "input_value",
          "name": "PWM_PIN_VALUE"
        }
      ],
      "category": Blockly.Categories.arduino,
      "extensions": ["colours_arduino", "shape_statement"]
    });
  }
};