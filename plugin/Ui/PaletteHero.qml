import QtQuick
import qs.Commons

Item {
  id: root

  property Component iconComponent: null
  property Component primaryControl: null
  property Component secondaryControl: null
  property string title: ""
  property string meta: ""
  property color foreground: Color.foreground
  property string fontFamily: Style.font.family
  property alias metaOpacity: metaText.opacity

  readonly property color dim: Qt.darker(foreground, 1.4)
  readonly property real trailingInset:
    primaryLoader.item && primaryLoader.item.visible
      ? primaryLoader.width + Style.space(12)
      : 0

  implicitHeight: Math.max(
    iconLoader.implicitHeight,
    labels.implicitHeight,
    primaryLoader.implicitHeight
  )

  Loader {
    id: iconLoader
    sourceComponent: root.iconComponent
    anchors.left: parent.left
    anchors.verticalCenter: parent.verticalCenter
  }

  Column {
    id: labels
    anchors.left: iconLoader.right
    anchors.leftMargin: Style.space(14)
    anchors.right: parent.right
    anchors.rightMargin: root.trailingInset
    anchors.verticalCenter: parent.verticalCenter
    spacing: Style.space(2)

    Text {
      width: parent.width
      text: root.title
      color: root.foreground
      font.family: root.fontFamily
      font.pixelSize: Style.font.title
      font.bold: true
      elide: Text.ElideRight
    }

    Item {
      width: parent.width
      height: metaText.implicitHeight

      Text {
        id: metaText
        anchors.left: parent.left
        anchors.verticalCenter: parent.verticalCenter
        width: Math.min(
          implicitWidth,
          Math.max(
            0,
            parent.width - (
              secondaryLoader.item && secondaryLoader.item.visible
                ? secondaryLoader.width + Style.space(6)
                : 0
            )
          )
        )
        text: root.meta.toUpperCase()
        color: root.dim
        font.family: root.fontFamily
        font.pixelSize: Style.font.caption
        font.bold: true
        font.letterSpacing: 1.2
        elide: Text.ElideRight
      }

      Loader {
        id: secondaryLoader
        sourceComponent: root.secondaryControl
        anchors.left: metaText.right
        anchors.leftMargin:
          item && item.visible ? Style.space(6) : 0
        anchors.verticalCenter: parent.verticalCenter
      }
    }
  }

  Loader {
    id: primaryLoader
    sourceComponent: root.primaryControl
    anchors.right: parent.right
    anchors.verticalCenter: parent.verticalCenter
  }
}
