import QtQuick
import qs.Commons
import qs.Ui

Item {
  id: root

  property color colorValue: "#000000"
  property color secondaryColorValue: "#000000"
  property bool split: false
  property bool selected: false
  property bool clickable: false
  property bool hasCursor: false
  property string tooltipText: ""
  property string accessibleName: tooltipText
  property real swatchSize: Style.space(19)
  readonly property real outlineInset: Style.spacing.hairline

  width: root.swatchSize + 2 * root.outlineInset
  height: width
  z: root.selected || root.hasCursor ? 1 : 0
  Accessible.role: Accessible.Button
  Accessible.name: root.accessibleName
  Accessible.focusable: root.clickable
  Accessible.onPressAction: {
    if (root.clickable) root.clicked()
  }
  signal clicked()

  ColorSquare {
    anchors.centerIn: parent
    squareSize: root.swatchSize
    colorValue: root.colorValue
    secondaryColorValue: root.secondaryColorValue
    split: root.split
    selected: root.selected || root.hasCursor
  }

  MouseArea {
    id: area
    anchors.fill: parent
    hoverEnabled: true
    acceptedButtons: root.clickable ? Qt.LeftButton : Qt.NoButton
    cursorShape: root.clickable ? Qt.PointingHandCursor : Qt.ArrowCursor
    onClicked: root.clicked()

    PanelToolTip {
      visible: area.containsMouse
      text: root.tooltipText
    }
  }
}
