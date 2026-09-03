pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Controls
import QtQml.WorkerScript
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Ui"

Panel {
  id: root

  moduleName: "unutranyholas.chromarchy"
  ipcTarget: "unutranyholas.chromarchy"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null
  readonly property var barIdentity: hostWidget || root

  property var proposal: ({})
  property var loadedConfig: ({})
  property var draftConfig: ({
    mode: "dark",
    modes: {
      dark: {
        surface: "#111318",
        neutral: "#8b8d98",
        accent: "#3d63dd",
        terminal: {},
        overrides: {}
      },
      light: {
        surface: "#f9fafb",
        neutral: "#8b8d98",
        accent: "#3d63dd",
        terminal: {},
        overrides: {}
      }
    }
  })
  property string pickerTarget: ""
  property bool stateLoaded: false
  property bool touched: false
  property bool undoAvailable: false
  property bool mutationRunning: false
  property bool seedEditing: false
  property string errorText: ""
  property int phraseIndex: 0
  property int requestSerial: 0
  property int latestGenerationRequest: 0
  property int latestStateRequest: 0
  property int latestMutationRequest: 0
  property string mutationAction: ""
  property bool generationPending: false
  property bool cursorActive: false
  property string focusSection: "apply"
  property string pickerReturnSection: ""

  readonly property var idlePhrases: [
    "Herding hexes",
    "Sorting swatches",
    "Balancing contrast",
    "Polishing neutrals",
    "Painting terminals",
    "Arranging accents",
    "Brewing colors",
    "Separating hues"
  ]
  readonly property var tokenRows: [
    ["lighter_background", "background", "dark_background", "darker_background"],
    ["muted", "dark_foreground", "light_foreground", "foreground", "bright_foreground"],
    ["accent", "selection"]
  ]
  readonly property var terminalKeys: [
    "red", "yellow", "green", "cyan", "blue", "magenta", "orange", "brown"
  ]
  readonly property var visibleSections: {
    const result = ["apply"]
    if (root.touched) result.push("revert")
    else if (root.undoAvailable) result.push("undo")
    result.push("mode", "seed:accent", "seed:neutral", "seed:surface")
    root.tokenRows.forEach(row => row.forEach(key => result.push("token:" + key)))
    root.terminalKeys.forEach(key => result.push("terminal:" + key))
    if (root.pickerTarget !== "")
      result.push("picker:0", "picker:1", "picker:2")
    return result
  }

  readonly property string mode: draftConfig.mode || "dark"
  readonly property var activeSeeds: draftConfig.modes
    ? draftConfig.modes[root.mode] || ({}) : ({})
  readonly property var terminalSeeds: activeSeeds.terminal || ({})
  readonly property color contentForeground: root.bar
    ? root.bar.foreground
    : Color.popups.text
  readonly property string contentFontFamily: root.bar
    ? root.bar.fontFamily
    : Style.font.family
  readonly property var colors: proposal.colors || ({})
  readonly property real previewSwatchSize: Style.space(19)
  readonly property real colorRowHeight: Style.space(28)
  readonly property bool generating: generateDelay.running || root.generationPending
  readonly property bool proposalReady: Object.keys(root.colors).length > 0
  readonly property bool busy: root.generating || root.mutationRunning || stateReader.running
  readonly property bool controlsEnabled: !root.mutationRunning && !stateReader.running
  readonly property string terminalPickerKey:
    root.pickerTarget.indexOf("terminal:") === 0
      ? root.pickerTarget.substring("terminal:".length)
      : ""
  readonly property string tokenPickerKey:
    root.pickerTarget.indexOf("token:") === 0
      ? root.pickerTarget.substring("token:".length)
      : ""
  readonly property string heroMeta: root.mutationRunning
    ? (root.mutationAction === "undo" ? "Restoring the desktop" : "Painting the desktop")
    : root.generating
      ? "Mixing pigments"
      : root.touched
        ? "Palette ready to apply"
        : root.idlePhrases[root.phraseIndex % root.idlePhrases.length]
  readonly property string helper: {
    const url = Qt.resolvedUrl("bin/chromarchy").toString()
    return url.startsWith("file://") ? decodeURIComponent(url.substring(7)) : url
  }

  onTouchedChanged: settleHeroMeta()
  onMutationRunningChanged: settleHeroMeta()
  onGeneratingChanged: settleHeroMeta()
  onOpenedChanged: if (!opened) root.cancelGeneration()
  onVisibleSectionsChanged: {
    if (root.visibleSections.indexOf(root.focusSection) < 0)
      root.focusSection = root.visibleSections[0]
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value))
  }

  function settleHeroMeta() {
    if (phraseSwap.running)
      phraseSwap.stop()
    if (hero)
      hero.metaOpacity = 1
  }

  function value(key, fallback) {
    return root.colors[key] || fallback
  }

  function configObject() {
    return root.copy({ mode: root.draftConfig.mode, modes: root.draftConfig.modes })
  }

  function setControls(config) {
    root.draftConfig = root.copy(config)
  }

  function replaceActiveSeeds(seeds) {
    const next = root.copy(root.draftConfig)
    next.modes[next.mode] = seeds
    root.draftConfig = next
  }

  function setSeed(key, value) {
    if (!root.controlsEnabled) return
    const seeds = root.copy(root.activeSeeds)
    seeds.overrides = {}
    seeds[key] = value
    root.replaceActiveSeeds(seeds)
    root.touched = true
    root.errorText = ""
    generateDelay.restart()
  }

  function commitSeedEditors() {
    for (let index = 0; index < seedRepeater.count; index += 1) {
      const item = seedRepeater.itemAt(index)
      if (item && !item.commitPending()) {
        root.errorText = item.label + " must be a six-digit hex color"
        return false
      }
    }
    return true
  }

  function resetSeedEditors() {
    for (let index = 0; index < seedRepeater.count; index += 1) {
      const item = seedRepeater.itemAt(index)
      if (item)
        item.resetPending()
    }
    root.updateSeedEditing()
  }

  function toggleMode() {
    if (!root.controlsEnabled || !root.commitSeedEditors()) return
    const next = root.copy(root.draftConfig)
    next.mode = next.mode === "dark" ? "light" : "dark"
    root.draftConfig = next
    root.pickerReturnSection = ""
    root.pickerTarget = ""
    root.touched = true
    root.errorText = ""
    generateDelay.restart()
  }

  function seedFor(key) {
    return root.activeSeeds[key]
  }

  function terminalSeedFor(key) {
    return root.terminalSeeds[key] || root.value(key, Color.foreground)
  }

  function setTerminalSeed(key, value) {
    if (!root.controlsEnabled) return
    const seeds = root.copy(root.activeSeeds)
    seeds.terminal = Object.assign({}, seeds.terminal || ({}))
    seeds.terminal[key] = value
    root.replaceActiveSeeds(seeds)
    root.touched = true
    root.errorText = ""
    generateDelay.restart()
  }

  function setOverride(key, value) {
    if (!root.controlsEnabled) return
    const seeds = root.copy(root.activeSeeds)
    seeds.overrides = Object.assign({}, seeds.overrides || ({}))
    seeds.overrides[key] = value
    root.replaceActiveSeeds(seeds)
    root.touched = true
    root.errorText = ""
    generateDelay.restart()
  }

  function editPickerValue(value) {
    if (root.tokenPickerKey !== "")
      root.setOverride(root.tokenPickerKey, value)
    else
      root.setTerminalSeed(root.terminalPickerKey, value)
  }

  function togglePicker(key) {
    if (root.pickerTarget === key) {
      if (root.pickerReturnSection !== "")
        root.closeCursorPicker()
      else
        root.pickerTarget = ""
      return
    }
    root.pickerReturnSection = ""
    root.pickerTarget = key
  }

  function openCursorPicker(key) {
    root.pickerReturnSection = key
    root.pickerTarget = key
    root.selectSection("picker:0")
  }

  function closeCursorPicker() {
    const section = root.pickerReturnSection
    root.pickerReturnSection = ""
    root.pickerTarget = ""
    if (section !== "")
      root.selectSection(section)
  }

  function dismissPickerOrClose() {
    if (root.pickerTarget !== "") {
      if (root.pickerReturnSection !== "")
        root.closeCursorPicker()
      else
        root.pickerTarget = ""
      return
    }
    root.close()
  }

  function updateSeedEditing() {
    let editing = false
    for (let index = 0; index < seedRepeater.count; index += 1) {
      const item = seedRepeater.itemAt(index)
      if (item && item.editing) {
        editing = true
        break
      }
    }
    root.seedEditing = editing
  }

  function revert() {
    if (!root.loadedConfig || Object.keys(root.loadedConfig).length === 0) return
    root.setControls(root.loadedConfig)
    root.touched = false
    root.pickerReturnSection = ""
    root.pickerTarget = ""
    root.errorText = ""
    Qt.callLater(root.resetSeedEditors)
    root.runGenerator()
  }

  function helperError(stderrText, stdoutText, fallback) {
    const stderr = stderrText.trim()
    if (stderr.length > 0) return stderr
    const stdout = stdoutText.trim()
    return stdout.length > 0 ? stdout : fallback
  }

  function runGenerator() {
    const id = ++root.requestSerial
    root.latestGenerationRequest = id
    root.generationPending = true
    generator.sendMessage({
      id: id,
      config: root.configObject()
    })
  }

  function generatorCompleted(response) {
    if (response.id !== root.latestGenerationRequest) return
    root.generationPending = false
    if (response.error) {
      root.errorText = response.error
      return
    }
    root.proposal = response.result
    root.errorText = ""
  }

  function cancelGeneration() {
    generateDelay.stop()
    root.generationPending = false
    root.latestGenerationRequest = ++root.requestSerial
  }

  function applyStateObject(state) {
    root.loadedConfig = root.copy(state.config || ({}))
    root.setControls(root.loadedConfig)
    root.undoAvailable = state.undoAvailable === true
    root.stateLoaded = true
    root.touched = false
    root.pickerReturnSection = ""
    root.pickerTarget = ""
    root.errorText = ""
    Qt.callLater(root.resetSeedEditors)
    root.runGenerator()
  }

  function reloadState() {
    root.pickerReturnSection = ""
    root.pickerTarget = ""
    if (root.mutationRunning || stateReader.running) return
    generateDelay.stop()
    root.generationPending = false
    root.latestGenerationRequest = ++root.requestSerial
    const id = ++root.requestSerial
    root.latestStateRequest = id
    stateReader.start([root.helper, "open"], id)
  }

  function stateCompleted(requestId, exitCode, exitStatus, stdoutText, stderrText) {
    if (requestId !== root.latestStateRequest || root.mutationRunning) return
    if (exitCode !== 0 || exitStatus !== 0) {
      root.errorText = root.helperError(stderrText, stdoutText,
        "Could not read the current theme")
      return
    }
    try {
      root.applyStateObject(JSON.parse(stdoutText))
    } catch (error) {
      root.errorText = "Could not read the current theme: " + error
    }
  }

  function applyPalette() {
    if (root.mutationRunning || stateReader.running
        || !root.commitSeedEditors()) return
    if (!root.touched || root.busy || !root.proposalReady) return
    root.errorText = ""
    root.mutationRunning = true
    root.mutationAction = "apply"
    root.latestStateRequest = 0
    const id = ++root.requestSerial
    root.latestMutationRequest = id
    mutator.start([
      root.helper,
      "apply",
      "--recipe-json",
      JSON.stringify({
        version: 1,
        config: root.configObject(),
        colors: root.colors
      })
    ], id)
  }

  function undoPalette() {
    if (root.mutationRunning || stateReader.running || !root.undoAvailable) return
    root.errorText = ""
    root.mutationRunning = true
    root.mutationAction = "undo"
    root.latestStateRequest = 0
    const id = ++root.requestSerial
    root.latestMutationRequest = id
    mutator.start([root.helper, "undo"], id)
  }

  function mutationCompleted(requestId, exitCode, exitStatus, stdoutText, stderrText) {
    if (requestId !== root.latestMutationRequest) return
    if (exitCode !== 0 || exitStatus !== 0) {
      root.mutationRunning = false
      root.errorText = root.helperError(stderrText, stdoutText,
        root.mutationAction === "undo" ? "Could not undo palette" : "Could not apply palette")
      return
    }
    try {
      const result = JSON.parse(stdoutText)
      root.applyStateObject(result.state)
      root.mutationRunning = false
    } catch (error) {
      root.mutationRunning = false
      root.errorText = (root.mutationAction === "undo"
        ? "Could not undo palette: "
        : "Could not apply palette: ") + error
    }
  }

  function open() {
    if (!root.stateLoaded)
      root.reloadState()
    root.controller.show()
    if (root.stateLoaded)
      root.runGenerator()
  }

  function close() {
    root.controller.hide()
  }

  function toggle() {
    if (root.opened) root.close()
    else root.open()
  }

  function switchPanel(direction) {
    if (root.bar && typeof root.bar.switchPanelFrom === "function")
      return root.bar.switchPanelFrom(root.barIdentity, direction)
    return false
  }

  function selectSection(section) {
    root.cursorActive = true
    root.focusSection = section
  }

  function horizontalSection(direction) {
    for (let rowIndex = 0; rowIndex < root.tokenRows.length; rowIndex += 1) {
      const row = root.tokenRows[rowIndex]
      const index = row.indexOf(root.focusSection.indexOf("token:") === 0
        ? root.focusSection.substring(6) : "")
      if (index >= 0)
        return "token:" + row[(index + direction + row.length) % row.length]
    }
    if (root.focusSection.indexOf("terminal:") === 0) {
      const key = root.focusSection.substring(9)
      const index = root.terminalKeys.indexOf(key)
      return "terminal:" + root.terminalKeys[
        (index + direction + root.terminalKeys.length) % root.terminalKeys.length]
    }
    return ""
  }

  function adjustVisiblePicker(channel, direction) {
    for (let index = 0; index < seedRepeater.count; index += 1) {
      const item = seedRepeater.itemAt(index)
      if (item && item.adjustPicker(channel, direction)) return
    }
    palettePreview.adjustPicker(channel, direction)
  }

  function moveCursor(dx, dy) {
    if (!root.cursorActive) {
      root.selectSection(root.visibleSections[0])
      return
    }
    if (root.focusSection.indexOf("picker:") === 0) {
      const channel = Number(root.focusSection.substring(7))
      if (dy !== 0)
        root.selectSection("picker:" + ((channel + dy + 3) % 3))
      else
        root.adjustVisiblePicker(channel, dx)
      return
    }
    if (dy !== 0) {
      const index = root.visibleSections.indexOf(root.focusSection)
      root.selectSection(root.visibleSections[
        (index + dy + root.visibleSections.length) % root.visibleSections.length])
      return
    }
    const section = root.horizontalSection(dx)
    if (section !== "") root.selectSection(section)
  }

  function activateCursor() {
    if (!root.cursorActive) {
      root.selectSection(root.visibleSections[0])
      return
    }
    if (root.focusSection.indexOf("picker:") === 0) root.closeCursorPicker()
    else if (root.focusSection === "apply") root.applyPalette()
    else if (root.focusSection === "revert") root.revert()
    else if (root.focusSection === "undo") root.undoPalette()
    else if (root.focusSection === "mode") root.toggleMode()
    else if (root.focusSection.indexOf("seed:") === 0) {
      const key = root.focusSection.substring(5)
      for (let index = 0; index < seedRepeater.count; index += 1) {
        const item = seedRepeater.itemAt(index)
        if (item && item.keyName === key) item.focusEditor()
      }
    } else if (root.focusSection.indexOf("token:") === 0
        || root.focusSection.indexOf("terminal:") === 0) {
      if (root.controlsEnabled)
        root.openCursorPicker(root.focusSection)
    }
  }

  function ensureVisible(item) {
    if (!item || !scrollArea.contentItem) return
    Qt.callLater(function() {
      const point = item.mapToItem(contentFrame, 0, 0)
      const top = scrollArea.contentItem.contentY
      if (point.y < top)
        scrollArea.contentItem.contentY = point.y
      else if (point.y + item.height > top + scrollArea.height)
        scrollArea.contentItem.contentY = point.y + item.height - scrollArea.height
    })
  }

  JsonProcess {
    id: stateReader
    onCompleted: function(requestId, exitCode, exitStatus, stdoutText, stderrText) {
      root.stateCompleted(requestId, exitCode, exitStatus, stdoutText, stderrText)
    }
  }

  WorkerScript {
    id: generator
    source: "PaletteWorker.mjs"
    onMessage: message => root.generatorCompleted(message)
  }

  JsonProcess {
    id: mutator
    onCompleted: function(requestId, exitCode, exitStatus, stdoutText, stderrText) {
      root.mutationCompleted(requestId, exitCode, exitStatus, stdoutText, stderrText)
    }
  }

  Timer {
    id: generateDelay
    interval: 90
    onTriggered: root.runGenerator()
  }

  Timer {
    interval: 2800
    running: root.opened
      && !root.mutationRunning
      && !root.generating
      && !root.touched
    repeat: true
    onTriggered: phraseSwap.restart()
  }

  SequentialAnimation {
    id: phraseSwap

    PropertyAnimation {
      target: hero
      property: "metaOpacity"
      to: 0
      duration: 180
      easing.type: Easing.OutQuad
    }

    ScriptAction {
      script: root.phraseIndex =
        (root.phraseIndex + 1) % root.idlePhrases.length
    }

    PropertyAnimation {
      target: hero
      property: "metaOpacity"
      to: 1
      duration: 260
      easing.type: Easing.InQuad
    }
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.barIdentity
    bar: root.bar
    open: root.opened
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(340))
    contentHeight: panel.fittedContentHeight(content.implicitHeight)

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      blocked: root.seedEditing
      onCloseRequested: root.dismissPickerOrClose()
      onTabRequested: function(direction) { root.switchPanel(direction) }
      onMoveRequested: function(dx, dy) { root.moveCursor(dx, dy) }
      onActivateRequested: root.activateCursor()

      ScrollView {
        id: scrollArea
        anchors.fill: parent
        clip: true
        ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
        ScrollBar.vertical.policy: content.implicitHeight > height
          ? ScrollBar.AsNeeded
          : ScrollBar.AlwaysOff

        Binding {
          target: scrollArea.contentItem
          property: "interactive"
          value: content.implicitHeight > scrollArea.height
        }

        Item {
          id: contentFrame
          width: scrollArea.availableWidth
          implicitHeight: content.implicitHeight

          MouseArea {
            anchors.fill: parent
            onPressed: {
              root.pickerReturnSection = ""
              root.pickerTarget = ""
              keyCatcher.forceActiveFocus()
            }
          }

          Column {
            id: content
            width: parent.width
            spacing: Style.space(14)

            Item {
              id: heroContainer
              width: parent.width
              implicitHeight: hero.implicitHeight

              PaletteHero {
                id: hero
                width: parent.width
                title: "Chromarchy"
                meta: root.heroMeta
                foreground: root.contentForeground
                fontFamily: root.contentFontFamily
                iconComponent: Component {
                  Text {
                    text: "󰏘"
                    color: hero.foreground
                    font.family: hero.fontFamily
                    font.pixelSize: Style.font.display
                  }
                }
                primaryControl: Component {
                  Button {
                    text: root.mutationRunning ? "Applying…" : "Apply"
                    foreground: hero.foreground
                    fontFamily: hero.fontFamily
                    fontSize: Style.font.bodySmall
                    bordered: true
                    active: root.touched
                    hasCursor: root.cursorActive && root.focusSection === "apply"
                    enabled: root.touched && root.proposalReady && !root.busy
                    opacity: enabled ? 1 : 0.4
                    onClicked: root.applyPalette()
                  }
                }
                secondaryControl: Component {
                  PanelActionButton {
                    iconText: "󰑐"
                    tooltipText: root.touched
                      ? "Revert unapplied changes"
                      : "Undo applied palette"
                    foreground: hero.foreground
                    fontFamily: hero.fontFamily
                    fontSize: Style.font.bodySmall
                    size: Style.space(18)
                    visible: root.touched || root.undoAvailable
                    enabled: !root.mutationRunning
                    hasCursor: root.cursorActive
                      && root.focusSection === (root.touched ? "revert" : "undo")
                    onClicked: {
                      keyCatcher.forceActiveFocus()
                      if (root.touched)
                        root.revert()
                      else
                        root.undoPalette()
                    }
                  }
                }
              }
            }

            PanelSeparator {
              foreground: root.contentForeground
            }

          Column {
            width: parent.width
            spacing: Style.space(10)

            Item {
              width: parent.width
              height: modeSwitch.implicitHeight

              PaletteLabel {
                anchors.left: parent.left
                anchors.verticalCenter: parent.verticalCenter
                rowHeight: parent.height
                text: "Theme"
                foreground: root.contentForeground
                fontFamily: root.contentFontFamily
              }

              Row {
                anchors.right: parent.right
                anchors.verticalCenter: parent.verticalCenter
                spacing: Style.space(6)

                Text {
                  anchors.verticalCenter: parent.verticalCenter
                  text: "Dark"
                  color: root.contentForeground
                  opacity: 1
                  font.family: root.contentFontFamily
                  font.pixelSize: Style.font.body
                }

                ToggleSwitch {
                  id: modeSwitch
                  checked: root.mode === "light"
                  busy: !root.controlsEnabled
                  hasCursor: root.cursorActive && root.focusSection === "mode"
                  foreground: root.contentForeground
                  onToggled: root.toggleMode()
                }

                Text {
                  anchors.verticalCenter: parent.verticalCenter
                  text: "Light"
                  color: root.contentForeground
                  opacity: 1
                  font.family: root.contentFontFamily
                  font.pixelSize: Style.font.body
                }
              }
            }
          }

          PanelSeparator {
            foreground: root.contentForeground
          }

          Column {
            width: parent.width
            spacing: Style.space(10)

            Repeater {
              id: seedRepeater
              model: [
                { key: "accent", label: "Accent" },
                { key: "neutral", label: "Gray" },
                { key: "surface", label: "Background" }
              ]

              SeedEditor {
                required property var modelData
                width: parent.width
                enabled: root.controlsEnabled
                keyName: modelData.key
                label: modelData.label
              }
            }
          }

          PanelSeparator {
            foreground: root.contentForeground
          }

          PalettePreview {
            id: palettePreview

            colors: root.colors
            tokenRows: root.tokenRows
            tokenLabels: ["Surface", "Text", "Accent"]
            mode: root.mode
            pickerTarget: root.pickerTarget
            focusSection: root.focusSection
            cursorActive: root.cursorActive
            controlsEnabled: root.controlsEnabled
            foreground: root.contentForeground
            fontFamily: root.contentFontFamily
            swatchSize: root.previewSwatchSize
            rowHeight: root.colorRowHeight
            pickerValue: root.tokenPickerKey !== ""
              ? root.value(root.tokenPickerKey, Color.foreground)
              : root.terminalSeedFor(root.terminalPickerKey)
            onPickerToggled: target => root.togglePicker(target)
            onEdited: value => root.editPickerValue(value)
            onVisibilityRequested: item => root.ensureVisible(item)
          }

          Text {
            visible: root.errorText.length > 0
            width: parent.width
            text: root.errorText
            textFormat: Text.PlainText
            color: Color.urgent
            font.family: root.contentFontFamily
            font.pixelSize: Style.font.bodySmall
            wrapMode: Text.WordWrap
          }

        }
        }
      }
    }
  }

  component SeedEditor: Column {
    id: seedEditor

    required property string keyName
    required property string label
    readonly property bool editing: hexField.editing
    readonly property bool hasCursor: root.cursorActive
      && root.focusSection === "seed:" + seedEditor.keyName

    function commitPending() {
      return hexField.commitPending()
    }

    function focusEditor() {
      hexField.focusEditor()
    }

    function resetPending() {
      hexField.resetPending()
    }

    function adjustPicker(channel, direction) {
      if (!seedPicker.visible) return false
      seedPicker.adjustChannel(channel, direction)
      return true
    }

    spacing: Style.space(6)
    onEditingChanged: Qt.callLater(root.updateSeedEditing)
    onHasCursorChanged: if (hasCursor) root.ensureVisible(seedEditor)

    Item {
      width: parent.width
      implicitHeight: Math.max(seedLabel.implicitHeight, hexField.implicitHeight)

      PaletteLabel {
        id: seedLabel
        anchors.left: parent.left
        anchors.verticalCenter: parent.verticalCenter
        rowHeight: hexField.implicitHeight
        text: seedEditor.label
        foreground: root.contentForeground
        fontFamily: root.contentFontFamily
      }

      HexField {
        id: hexField
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        pickerOpen: root.pickerTarget === seedEditor.keyName
        hasCursor: seedEditor.hasCursor
        value: root.seedFor(seedEditor.keyName)
        accessibleName: seedEditor.label + " color"
        onCommitted: value => root.setSeed(seedEditor.keyName, value)
        onPickerRequested: root.togglePicker(seedEditor.keyName)
      }
    }

    InlineOklchPicker {
      id: seedPicker
      visible: root.pickerTarget === seedEditor.keyName
      width: parent.width
      height: visible ? implicitHeight : 0
      value: root.seedFor(seedEditor.keyName)
      cursorChannel: root.focusSection.indexOf("picker:") === 0
        ? Number(root.focusSection.substring(7)) : -1
      onCursorChannelChanged: if (cursorChannel >= 0) root.ensureVisible(seedPicker)
      onEdited: value => root.setSeed(seedEditor.keyName, value)
    }
  }

}
