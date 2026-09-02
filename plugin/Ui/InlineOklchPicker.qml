pragma ComponentBehavior: Bound

import QtQuick
import qs.Commons
import qs.Ui

Item {
  id: root

  property color value: "#000000"
  property real lightness: 0
  property real chroma: 0
  property real hue: 0
  property bool editing: false
  property int cursorChannel: -1
  readonly property real barHeight: Style.space(27)
  readonly property real barSpacing: Math.max(0,
    Style.space(5) - 2 * Style.spacing.hairline)
  readonly property color currentColor:
    root.colorHex(root.lightness, root.chroma, root.hue)
  signal edited(string value)

  implicitHeight: 3 * root.barHeight + 2 * root.barSpacing

  function linearChannel(value) {
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4)
  }

  function gammaChannel(value) {
    return value <= 0.0031308
      ? 12.92 * value
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055
  }

  function fromSrgb(red, green, blue) {
    const r = root.linearChannel(red)
    const g = root.linearChannel(green)
    const b = root.linearChannel(blue)
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const yellow = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    let hue = Math.atan2(yellow, a) * 180 / Math.PI
    if (hue < 0) hue += 360
    return {
      l: lightness,
      c: Math.sqrt(a * a + yellow * yellow),
      h: hue
    }
  }

  function toLinearSrgb(lightness, chroma, hue) {
    const angle = hue * Math.PI / 180
    const a = chroma * Math.cos(angle)
    const yellow = chroma * Math.sin(angle)
    const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * yellow
    const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * yellow
    const sRoot = lightness - 0.0894841775 * a - 1.291485548 * yellow
    const l = lRoot * lRoot * lRoot
    const m = mRoot * mRoot * mRoot
    const s = sRoot * sRoot * sRoot
    return {
      r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    }
  }

  function inGamut(rgb) {
    const epsilon = 0.000001
    return rgb.r >= -epsilon && rgb.r <= 1 + epsilon
      && rgb.g >= -epsilon && rgb.g <= 1 + epsilon
      && rgb.b >= -epsilon && rgb.b <= 1 + epsilon
  }

  function maximumChroma(lightness, hue) {
    let low = 0
    let high = 0.4
    for (let index = 0; index < 12; index += 1) {
      const middle = (low + high) / 2
      if (root.inGamut(root.toLinearSrgb(lightness, middle, hue)))
        low = middle
      else
        high = middle
    }
    return low
  }

  function byte(value) {
    return Math.round(Math.max(0, Math.min(1, value)) * 255)
      .toString(16).padStart(2, "0")
  }

  function colorHex(lightness, chroma, hue) {
    const rgb = root.toLinearSrgb(lightness, chroma, hue)
    return "#" + root.byte(root.gammaChannel(rgb.r))
      + root.byte(root.gammaChannel(rgb.g))
      + root.byte(root.gammaChannel(rgb.b))
  }

  function syncFromValue() {
    if (root.editing) return
    const next = root.fromSrgb(root.value.r, root.value.g, root.value.b)
    root.lightness = next.l
    root.chroma = next.c
    root.hue = next.h
  }

  function emitValue() {
    root.edited(root.colorHex(root.lightness, root.chroma, root.hue))
  }

  function rescaleChroma(chroma, oldMaximum, newMaximum) {
    if (oldMaximum <= 0.000001) return 0
    const ratio = Math.max(0, Math.min(1, chroma / oldMaximum))
    return ratio * newMaximum
  }

  function channelPosition(channel) {
    if (channel === 0) return root.lightness
    if (channel === 1) return root.chroma / 0.4
    return root.hue / 360
  }

  function adjustChannel(channel, direction) {
    root.setChannel(channel, root.channelPosition(channel) + direction * 0.02)
  }

  function setChannel(channel, position) {
    root.editing = true
    const value = Math.max(0, Math.min(1, position))
    const oldChroma = root.chroma
    const oldMaximum = root.maximumChroma(root.lightness, root.hue)
    if (channel === 0) {
      root.lightness = value
    } else if (channel === 1) {
      root.chroma = 0.4 * value
    } else {
      root.hue = 360 * value
    }
    const newMaximum = root.maximumChroma(root.lightness, root.hue)
    if (channel === 1) {
      root.chroma = Math.min(
        root.chroma,
        newMaximum
      )
    } else {
      root.chroma = root.rescaleChroma(
        oldChroma,
        oldMaximum,
        newMaximum
      )
    }
    root.emitValue()
    root.editing = false
  }

  onValueChanged: syncFromValue()
  Component.onCompleted: {
    syncFromValue()
    const red = fromSrgb(1, 0, 0)
    console.assert(colorHex(red.l, red.c, red.h) === "#ff0000",
      "OKLCH conversion self-check failed")
    console.assert(Math.abs(rescaleChroma(0.1, 0.2, 0.3) - 0.15) < 0.000001,
      "OKLCH proportional chroma self-check failed")
  }

  Column {
    anchors.fill: parent
    spacing: root.barSpacing

    ChannelSlider {
      width: parent.width
      height: root.barHeight
      channel: 0
      position: root.lightness
      roundTop: true
      roundBottom: true
      hasCursor: root.cursorChannel === channel
      accessibleName: "OKLCH lightness"
      onMoved: position => root.setChannel(channel, position)
    }

    ChannelSlider {
      width: parent.width
      height: root.barHeight
      channel: 1
      position: root.chroma / 0.4
      roundTop: true
      roundBottom: true
      hasCursor: root.cursorChannel === channel
      accessibleName: "OKLCH chroma"
      onMoved: position => root.setChannel(channel, position)
    }

    ChannelSlider {
      width: parent.width
      height: root.barHeight
      channel: 2
      position: root.hue / 360
      roundTop: true
      roundBottom: true
      hasCursor: root.cursorChannel === channel
      accessibleName: "OKLCH hue"
      onMoved: position => root.setChannel(channel, position)
    }
  }

  component ChannelSlider: Item {
    id: slider

    required property int channel
    required property real position
    property bool roundTop: false
    property bool roundBottom: false
    property bool hasCursor: false
    property string accessibleName: ""
    signal moved(real position)

    Accessible.role: Accessible.Slider
    Accessible.name: slider.accessibleName
    Accessible.focusable: true
    Accessible.onIncreaseAction: root.adjustChannel(slider.channel, 1)
    Accessible.onDecreaseAction: root.adjustChannel(slider.channel, -1)

    Item {
      id: track

      anchors.fill: parent

      ShaderEffect {
        anchors.fill: parent
        property int pickerChannel: slider.channel
        property real pickerLightness: root.lightness
        property real pickerChroma: root.chroma
        property real pickerHue: root.hue
        property vector2d pickerSize: Qt.vector2d(width, height)
        property real pickerRadius: Style.cornerRadius
        property int pickerRoundTop: slider.roundTop ? 1 : 0
        property int pickerRoundBottom: slider.roundBottom ? 1 : 0
        fragmentShader: "shaders/oklch.frag.qsb"
      }

      Rectangle {
        x: Math.max(0, Math.min(parent.width - width,
          slider.position * parent.width - width / 2))
        anchors.verticalCenter: parent.verticalCenter
        width: Style.space(12)
        height: width
        radius: width / 2
        color: root.currentColor
        border.width: 2
        border.color: root.lightness > 0.62 ? "#202020" : "#ffffff"
      }

      Rectangle {
        anchors.fill: parent
        radius: Style.cornerRadius
        color: "transparent"
        border.width: slider.hasCursor ? 2 : Style.spacing.hairline
        border.color: slider.hasCursor ? Color.selection : Style.normalBorderColor
      }

      MouseArea {
        anchors.fill: parent
        cursorShape: Qt.PointingHandCursor
        onPressed: mouse => slider.moved(mouse.x / width)
        onPositionChanged: mouse => {
          if (pressed) slider.moved(mouse.x / width)
        }
      }
    }
  }
}
