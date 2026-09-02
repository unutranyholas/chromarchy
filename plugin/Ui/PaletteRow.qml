pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import qs.Commons

RowLayout {
  id: root

  property string label: ""
  property var names: []
  property var colors: []
  property color foreground: Color.foreground
  property string fontFamily: Style.font.family
  property real swatchSize: Style.space(19)
  property real rowHeight: Style.space(28)
  property string selectedName: ""
  property string cursorName: ""
  property bool clickable: false
  signal swatchClicked(string name)

  spacing: Style.space(8)

  PaletteLabel {
    text: root.label
    foreground: root.foreground
    fontFamily: root.fontFamily
    rowHeight: root.rowHeight
    Layout.preferredWidth: Style.space(62)
    Layout.preferredHeight: root.rowHeight
  }

  Item { Layout.fillWidth: true }

  Row {
    Layout.alignment: Qt.AlignVCenter
    spacing: Math.max(0, Style.space(5) - 2 * Style.spacing.hairline)

    Repeater {
      model: root.colors

      ColorSwatch {
        required property int index
        required property var modelData
        swatchSize: root.swatchSize
        colorValue: modelData
        selected: root.selectedName === root.names[index]
        hasCursor: root.cursorName === root.names[index]
        clickable: root.clickable
        tooltipText: (root.names[index] || "") + "  " + modelData
        onClicked: root.swatchClicked(root.names[index])
      }
    }
  }

}
