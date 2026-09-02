import QtQuick
import qs.Commons
import qs.Ui

BorderSurface {
  id: root

  property color colorValue: "#000000"
  property color secondaryColorValue: "#000000"
  property color borderColor: Qt.rgba(0, 0, 0, 0.28)
  property color selectedBorderColor: Style.selectedBorderColor
  property bool split: false
  property bool selected: false
  property real squareSize: Style.space(19)

  width: squareSize
  height: width
  radius: Math.min(Style.cornerRadius, Style.space(4))
  color: "transparent"
  borderSpec: Border.none()

  Canvas {
    id: canvas

    anchors.fill: parent

    onPaint: {
      const context = getContext("2d")
      const edge = Style.spacing.hairline / 2
      const radius = Math.max(0, root.radius - edge)

      function roundedPath(inset) {
        const left = inset
        const top = inset
        const right = width - inset
        const bottom = height - inset
        context.beginPath()
        context.moveTo(left + radius, top)
        context.lineTo(right - radius, top)
        context.quadraticCurveTo(right, top, right, top + radius)
        context.lineTo(right, bottom - radius)
        context.quadraticCurveTo(right, bottom, right - radius, bottom)
        context.lineTo(left + radius, bottom)
        context.quadraticCurveTo(left, bottom, left, bottom - radius)
        context.lineTo(left, top + radius)
        context.quadraticCurveTo(left, top, left + radius, top)
        context.closePath()
      }

      context.clearRect(0, 0, width, height)
      context.save()
      roundedPath(0)
      context.clip()

      context.fillStyle = root.colorValue
      context.fillRect(0, 0, width, height)

      if (root.split) {
        context.fillStyle = root.secondaryColorValue
        context.beginPath()
        context.moveTo(width, 0)
        context.lineTo(width, height)
        context.lineTo(0, height)
        context.closePath()
        context.fill()
      }

      roundedPath(edge)
      context.lineWidth = Style.spacing.hairline
      context.strokeStyle = root.borderColor
      context.stroke()

      context.restore()
    }
  }

  Rectangle {
    visible: root.selected
    anchors.fill: parent
    anchors.margins: -Style.spacing.hairline
    radius: root.radius + Style.spacing.hairline
    color: "transparent"
    border.width: Style.spacing.hairline
    border.color: root.selectedBorderColor
  }

  onColorValueChanged: canvas.requestPaint()
  onSecondaryColorValueChanged: canvas.requestPaint()
  onBorderColorChanged: canvas.requestPaint()
  onSplitChanged: canvas.requestPaint()
  onWidthChanged: canvas.requestPaint()
  onHeightChanged: canvas.requestPaint()
  onRadiusChanged: canvas.requestPaint()
  Component.onCompleted: canvas.requestPaint()
}
