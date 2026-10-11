# 67Router tray icon for Windows using NotifyIcon
# IPC: stdin JSON commands, stdout JSON events
param([string]$IconPath, [string]$Tooltip)

$ErrorActionPreference = "Stop"

Add-Type @"
using System;
using System.IO;
using System.Collections.Concurrent;
using System.Threading;
using System.Runtime.InteropServices;

public static class WinDpiAwareness {
  public static IntPtr PerMonitorAwareV2 { get { return new IntPtr(-4); } }
  public static IntPtr PerMonitorAware { get { return new IntPtr(-3); } }

  [DllImport("user32.dll")]
  public static extern bool SetProcessDpiAwarenessContext(IntPtr value);

  [DllImport("user32.dll")]
  public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr value);

  [DllImport("shcore.dll")]
  public static extern int SetProcessDpiAwareness(int value);

  [DllImport("user32.dll")]
  public static extern bool SetProcessDPIAware();
}

public static class StdinReader {
  private static readonly ConcurrentQueue<string> _queue = new ConcurrentQueue<string>();
  private static Thread _thread;
  private static volatile bool _running = false;

  public static void Start() {
    if (_running) return;
    _running = true;
    _thread = new Thread(Run) {
      IsBackground = true,
      Name = "StdinReaderThread"
    };
    _thread.Start();
  }

  public static void Stop() {
    _running = false;
  }

  private static void Run() {
    try {
      string line;
      while (_running && (line = Console.ReadLine()) != null) {
        if (!string.IsNullOrWhiteSpace(line)) {
          _queue.Enqueue(line);
        }
      }
    } catch { }
  }

  public static string TryReadLine() {
    string line;
    if (_queue.TryDequeue(out line)) {
      return line;
    }
    return null;
  }
}
"@

function Enable-HighDpiAwareness {
  $contexts = @(
    [WinDpiAwareness]::PerMonitorAwareV2,
    [WinDpiAwareness]::PerMonitorAware
  )

  foreach ($context in $contexts) {
    try {
      if ([WinDpiAwareness]::SetProcessDpiAwarenessContext($context)) { break }
    } catch {}
  }

  try { [WinDpiAwareness]::SetProcessDpiAwareness(2) | Out-Null } catch {}
  try { [WinDpiAwareness]::SetProcessDPIAware() | Out-Null } catch {}

  foreach ($context in $contexts) {
    try {
      $previous = [WinDpiAwareness]::SetThreadDpiAwarenessContext($context)
      if ($previous -ne [IntPtr]::Zero) { break }
    } catch {}
  }
}

Enable-HighDpiAwareness

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

[System.Windows.Forms.Application]::EnableVisualStyles()
[System.Windows.Forms.Application]::SetCompatibleTextRenderingDefault($false)

# Safe tooltip truncation (Win32 NotifyIcon.Text max 63 characters)
if ($Tooltip -and $Tooltip.Length -gt 63) {
  $Tooltip = $Tooltip.Substring(0, 63)
}

$script:notifyIcon = New-Object System.Windows.Forms.NotifyIcon
try {
  $script:notifyIcon.Icon = New-Object System.Drawing.Icon($IconPath)
} catch {
  $script:notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
}
$script:notifyIcon.Text = $Tooltip
$script:notifyIcon.Visible = $true

$script:menu = New-Object System.Windows.Forms.ContextMenuStrip
$script:notifyIcon.ContextMenuStrip = $script:menu
$script:items = @()

function Write-Event($obj) {
  try {
    $json = $obj | ConvertTo-Json -Compress
    [Console]::Out.WriteLine($json)
    [Console]::Out.Flush()
  } catch {}
}

function Add-MenuItem($index, $title, $enabled) {
  $item = New-Object System.Windows.Forms.ToolStripMenuItem
  $item.Text = $title
  $item.Enabled = $enabled
  $idx = $index
  $item.Add_Click({ Write-Event @{ type = "click"; index = $idx } }.GetNewClosure())
  $script:menu.Items.Add($item) | Out-Null
  $script:items += $item
}

function Update-MenuItem($index, $title, $enabled) {
  if ($index -lt $script:items.Count) {
    $script:items[$index].Text = $title
    $script:items[$index].Enabled = $enabled
  }
}

function Set-Tooltip($text) {
  if ($text -and $text.Length -gt 63) { $text = $text.Substring(0, 63) }
  $script:notifyIcon.Text = $text
}

# Start non-blocking background stdin reader thread
[StdinReader]::Start()

# UI thread timer polls thread-safe queue without blocking message loop
$script:timer = New-Object System.Windows.Forms.Timer
$script:timer.Interval = 100
$script:timer.Add_Tick({
  try {
    while ($null -ne ($line = [StdinReader]::TryReadLine())) {
      $cmd = $line | ConvertFrom-Json
      switch ($cmd.action) {
        "add-item"    { Add-MenuItem $cmd.index $cmd.title $cmd.enabled }
        "update-item" { Update-MenuItem $cmd.index $cmd.title $cmd.enabled }
        "set-tooltip" { Set-Tooltip $cmd.text }
        "ready"       { Write-Event @{ type = "ready" } }
        "kill"        {
          [StdinReader]::Stop()
          $script:notifyIcon.Visible = $false
          $script:notifyIcon.Dispose()
          [System.Windows.Forms.Application]::Exit()
        }
      }
    }
  } catch {
    Write-Event @{ type = "error"; message = $_.Exception.Message }
  }
})
$script:timer.Start()

Write-Event @{ type = "started" }
[System.Windows.Forms.Application]::Run()
