import Quickshell
import QtQuick
import QtQml.WorkerScript

ShellRoot {
  id: root

  property int responses: 0

  function validConfig() {
    return {
      mode: "light",
      modes: {
        dark: {
          surface: "#111318",
          neutral: "#8B8D98",
          accent: "#3D63DD",
          terminal: {}
        },
        light: {
          surface: "#EFF1F5",
          neutral: "#8B8D98",
          accent: "#FFCC00",
          terminal: {}
        }
      }
    }
  }

  WorkerScript {
    id: worker
    source: "PaletteWorker.mjs"
    onMessage: function(message) {
      if (root.responses === 0) {
        if (!message.error) {
          console.error("Palette worker accepted invalid input")
          Qt.exit(1)
          return
        }
        root.responses++
        worker.sendMessage({ id: 2, config: root.validConfig() })
        return
      }
      if (message.error || !message.result || !message.result.colors
          || message.result.colors.accent !== "#efba00") {
        console.error(message.error || "Palette worker returned no colors")
        Qt.exit(1)
        return
      }
      console.log(message.result.colors.accent)
      Qt.quit()
    }
  }

  Timer {
    interval: 5000
    running: true
    onTriggered: {
      console.error("Palette worker timed out")
      Qt.exit(1)
    }
  }

  Component.onCompleted: {
    console.log("Worker source:", worker.source)
    worker.sendMessage({
      id: 1,
      config: {}
    })
  }
}
