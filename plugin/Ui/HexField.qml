import QtQuick
import QtQuick.Layouts
import qs.Commons
import qs.Ui

RowLayout {
  id: root

  property string value: "#000000"
  property string accessibleName: ""
  property bool pickerOpen: false
  property bool hasCursor: false
  readonly property bool editing: input.activeFocus
  readonly property real controlHeight: Style.space(28)
  readonly property real swatchSize: Style.space(17)
  readonly property real swatchInset: Math.max(0, (input.height - swatchSize) / 2)
  readonly property bool valid: /^[0-9A-F]{6}$/.test(input.text)
  signal committed(string value)
  signal pickerRequested()

  spacing: 0
  implicitWidth: Style.space(146)
  implicitHeight: controlHeight

  function displayValue(value) {
    return String(value || "").replace(/^#/, "").toUpperCase()
  }

  function finishEditing() {
    if (!root.valid) return false
    const value = "#" + input.text.replace(/^#/, "").toUpperCase()
    input.text = root.displayValue(value)
    if (value.toLowerCase() !== String(root.value).toLowerCase())
      root.committed(value)
    return true
  }

  function commitPending() {
    if (root.finishEditing()) return true
    input.forceActiveFocus()
    input.selectAll()
    return false
  }

  function focusEditor() {
    input.forceActiveFocus()
  }

  function resetPending() {
    input.text = root.displayValue(root.value)
    input.focus = false
  }

  onValueChanged: {
    const display = root.displayValue(root.value)
    if (input.text !== display)
      input.text = display
  }

  TextField {
    id: input

    text: root.displayValue(root.value)
    Accessible.name: root.accessibleName
    foreground: Color.popups.text
    accent: root.valid && !root.hasCursor ? Color.accent
      : root.valid ? Color.selection : Color.urgent
    font.family: "monospace"
    font.pixelSize: Style.font.body
    selectByMouse: true
    leftPadding: root.swatchInset
      + root.swatchSize
      + Style.spacing.controlGap
    Layout.fillWidth: true
    Layout.preferredHeight: root.controlHeight

    onActiveFocusChanged: {
      if (activeFocus) {
        if (!root.pickerOpen)
          root.pickerRequested()
        Qt.callLater(function() {
          if (input.activeFocus)
            input.selectAll()
        })
      } else if (root.pickerOpen) {
        root.pickerRequested()
      }
    }
    onTextEdited: {
      const previous = text
      const previousCursor = cursorPosition
      const prefix = previous.substring(0, previousCursor)
      const normalized = previous.replace(/#/g, "").toUpperCase()
      if (normalized !== previous) {
        text = normalized
        cursorPosition = Math.min(
          prefix.replace(/#/g, "").length,
          text.length
        )
      }
    }
    onEditingFinished: {
      if (!root.finishEditing())
        root.resetPending()
    }
    Keys.onEscapePressed: {
      text = root.displayValue(root.value)
      if (root.pickerOpen)
        root.pickerRequested()
      focus = false
    }

    ColorSquare {
      id: inputSwatch

      anchors.left: parent.left
      anchors.leftMargin: root.swatchInset
      anchors.verticalCenter: parent.verticalCenter
      squareSize: root.swatchSize
      colorValue: root.valid
        ? "#" + input.text.replace(/^#/, "")
        : root.value
    }

    MouseArea {
      anchors.fill: inputSwatch
      cursorShape: Qt.PointingHandCursor
      onClicked: input.forceActiveFocus()
    }
  }
}
