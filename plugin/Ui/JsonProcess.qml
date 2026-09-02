import QtQuick
import Quickshell.Io

Item {
  id: root

  readonly property bool running: started && !published
  property bool started: false
  property bool published: false
  property bool exited: false
  property bool stdoutFinished: false
  property bool stderrFinished: false
  property int requestId: 0
  property int exitCode: -1
  property int exitStatus: -1
  property string stdoutText: ""
  property string stderrText: ""
  signal completed(int requestId, int exitCode, int exitStatus,
    string stdoutText, string stderrText)

  function start(command, requestId) {
    if (root.running) return false
    root.started = true
    root.published = false
    root.exited = false
    root.stdoutFinished = false
    root.stderrFinished = false
    root.requestId = requestId
    root.exitCode = -1
    root.exitStatus = -1
    root.stdoutText = ""
    root.stderrText = ""
    process.command = command
    process.running = true
    return true
  }

  function finishIfReady() {
    if (root.published || !root.exited
        || !root.stdoutFinished || !root.stderrFinished) return
    root.published = true
    root.completed(root.requestId, root.exitCode, root.exitStatus,
      root.stdoutText, root.stderrText)
  }

  Process {
    id: process

    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        root.stdoutText = text
        root.stdoutFinished = true
        root.finishIfReady()
      }
    }
    stderr: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        root.stderrText = text
        root.stderrFinished = true
        root.finishIfReady()
      }
    }
    onExited: function(exitCode, exitStatus) {
      root.exitCode = exitCode
      root.exitStatus = exitStatus
      root.exited = true
      root.finishIfReady()
    }
  }
}
