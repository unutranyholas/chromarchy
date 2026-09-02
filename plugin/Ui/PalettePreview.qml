pragma ComponentBehavior: Bound

import QtQuick
import qs.Commons
import qs.Ui

Column {
  id: root

  property var colors: ({})
  property var tokenRows: []
  property var tokenLabels: []
  property string mode: "dark"
  property string pickerTarget: ""
  property string focusSection: ""
  property bool cursorActive: false
  property bool controlsEnabled: false
  property color foreground: Color.foreground
  property string fontFamily: Style.font.family
  property real swatchSize: Style.space(19)
  property real rowHeight: Style.space(28)
  property color pickerValue: Color.foreground

  readonly property string tokenPickerKey:
    pickerTarget.indexOf("token:") === 0 ? pickerTarget.substring(6) : ""
  readonly property string terminalPickerKey:
    pickerTarget.indexOf("terminal:") === 0 ? pickerTarget.substring(9) : ""
  readonly property var terminalPairs: [
    ["red", "bright_red"],
    ["yellow", "bright_yellow"],
    ["green", "bright_green"],
    ["cyan", "bright_cyan"],
    ["blue", "bright_blue"],
    ["magenta", "bright_magenta"],
    ["orange"],
    ["brown"]
  ]

  signal pickerToggled(string target)
  signal edited(string value)
  signal visibilityRequested(var item)

  width: parent ? parent.width : implicitWidth
  spacing: Style.space(10)

  function color(key, fallback) {
    return root.colors[key] || fallback
  }

  function adjustPicker(channel, direction) {
    for (let index = 0; index < tokenRepeater.count; index += 1) {
      const item = tokenRepeater.itemAt(index)
      if (item && item.adjustPicker(channel, direction))
        return true
    }
    if (terminalPicker.visible) {
      terminalPicker.adjustChannel(channel, direction)
      return true
    }
    return false
  }

  Repeater {
    id: tokenRepeater
    model: root.tokenRows

    Column {
      id: tokenGroup

      required property int index
      required property var modelData

      width: root.width
      spacing: root.spacing

      function adjustPicker(channel, direction) {
        if (!tokenPicker.visible) return false
        tokenPicker.adjustChannel(channel, direction)
        return true
      }

      PaletteRow {
        id: tokenRow

        width: parent.width
        label: root.tokenLabels[tokenGroup.index] || ""
        foreground: root.foreground
        fontFamily: root.fontFamily
        swatchSize: root.swatchSize
        rowHeight: root.rowHeight
        names: tokenGroup.modelData
        colors: names.map(key => root.color(key, Color.foreground))
        selectedName: root.tokenPickerKey
        cursorName: root.cursorActive && root.focusSection.indexOf("token:") === 0
          ? root.focusSection.substring(6) : ""
        clickable: root.controlsEnabled
        onCursorNameChanged: if (cursorName !== "") root.visibilityRequested(tokenRow)
        onSwatchClicked: name => root.pickerToggled("token:" + name)
      }

      InlineOklchPicker {
        id: tokenPicker

        visible: tokenRow.names.indexOf(root.tokenPickerKey) >= 0
        width: parent.width
        height: visible ? implicitHeight : 0
        value: root.pickerValue
        cursorChannel: root.focusSection.indexOf("picker:") === 0
          ? Number(root.focusSection.substring(7)) : -1
        onCursorChannelChanged:
          if (cursorChannel >= 0) root.visibilityRequested(tokenPicker)
        onEdited: value => root.edited(value)
      }
    }
  }

  Item {
    width: parent.width
    height: root.rowHeight

    PaletteLabel {
      anchors.left: parent.left
      anchors.verticalCenter: parent.verticalCenter
      width: Style.space(62)
      rowHeight: parent.height
      text: "Terminal"
      foreground: root.foreground
      fontFamily: root.fontFamily
    }

    Row {
      anchors.right: parent.right
      anchors.verticalCenter: parent.verticalCenter
      spacing: Math.max(0, Style.space(4) - 2 * Style.spacing.hairline)

      Repeater {
        model: root.terminalPairs

        ColorSwatch {
          required property var modelData
          readonly property string terminalKey: modelData[0]
          readonly property bool reversePair: modelData.length > 1 && root.mode === "light"
          swatchSize: root.swatchSize
          colorValue: root.color(
            reversePair ? modelData[1] : modelData[0],
            Color.foreground
          )
          secondaryColorValue: root.color(
            modelData.length > 1
              ? reversePair ? modelData[0] : modelData[1]
              : modelData[0],
            Color.foreground
          )
          split: modelData.length > 1
          selected: root.terminalPickerKey === terminalKey
          hasCursor: root.cursorActive
            && root.focusSection === "terminal:" + terminalKey
          clickable: root.controlsEnabled
          tooltipText: modelData
            .map(key => key + "  " + root.color(key, Color.foreground))
            .join("\n")
          onHasCursorChanged: if (hasCursor) root.visibilityRequested(this)
          onClicked: root.pickerToggled("terminal:" + terminalKey)
        }
      }
    }
  }

  InlineOklchPicker {
    id: terminalPicker

    visible: root.terminalPickerKey !== ""
    width: parent.width
    height: visible ? implicitHeight : 0
    value: root.pickerValue
    cursorChannel: root.focusSection.indexOf("picker:") === 0
      ? Number(root.focusSection.substring(7)) : -1
    onCursorChannelChanged:
      if (cursorChannel >= 0) root.visibilityRequested(terminalPicker)
    onEdited: value => root.edited(value)
  }
}
