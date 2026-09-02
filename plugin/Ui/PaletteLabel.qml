import QtQuick
import qs.Commons

Text {
  property color foreground: Color.foreground
  property string fontFamily: Style.font.family
  property real rowHeight: Style.space(19)

  width: Style.space(62)
  height: rowHeight
  color: foreground
  opacity: 1
  font.family: fontFamily
  font.pixelSize: Style.font.body
  verticalAlignment: Text.AlignVCenter
}
