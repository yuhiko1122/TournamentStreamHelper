import re
import unicodedata
from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *
import requests
import os
import traceback
import json
import copy
import pynput
from .SettingsManager import SettingsManager

class TSHHotkeysSignals(QObject):
    team1_score_up = pyqtSignal()
    team1_score_down = pyqtSignal()
    team2_score_up = pyqtSignal()
    team2_score_down = pyqtSignal()
    reset_scores = pyqtSignal()
    load_set = pyqtSignal()
    swap_teams = pyqtSignal()

class TSHHotkeys(QObject):
    instance: "TSHHotkeys" = None
    signals = TSHHotkeysSignals()
    parent: QWidget = None
    shortcuts = {}

    keys = {
        "load_set": "Ctrl+O",
        "team1_score_up": "Ctrl+F1",
        "team1_score_down": "Ctrl+F2",
        "team2_score_up": "Ctrl+F3",
        "team2_score_down": "Ctrl+F4",
        "reset_scores": "Ctrl+R",
        "swap_teams": "Ctrl+S"
    }
    QApplication.translate("settings.hotkeys", "load_set")
    QApplication.translate("settings.hotkeys", "team1_score_up")
    QApplication.translate("settings.hotkeys", "team1_score_down")
    QApplication.translate("settings.hotkeys", "team2_score_up")
    QApplication.translate("settings.hotkeys", "team2_score_down")
    QApplication.translate("settings.hotkeys", "reset_scores")
    QApplication.translate("settings.hotkeys", "swap_teams")

    loaded_keys = {}

    pynputListener = None

    def __init__(self) -> None:
        super().__init__()
        self.LoadUserHotkeys()

    def UiMounted(self, parent):
        self.parent = parent
        self.SetupHotkeys()

    def ReloadHotkeys(self):
        self.LoadUserHotkeys()
        self.SetupHotkeys()
    
    def SetupHotkeys(self):
        if self.pynputListener:
            self.pynputListener.stop()
        
        self.pynputListener = pynput.keyboard.GlobalHotKeys({
            TSHHotkeys.qshortcut_to_pynput(value): lambda key=key, value=value: self.HotkeyTriggered(key, value) for (key, value) in self.loaded_keys.items()
        })

        self.pynputListener.start()
    
    def HotkeyTriggered(self, k, v):
        if not SettingsManager.Get("hotkeys.hotkeys_enabled", True) == False:
            print(f"Activated {k} by pressing {v}")
            getattr(self.signals, k).emit()
    
    def LoadUserHotkeys(self):
        user_keys = SettingsManager.Get("hotkeys")
        self.loaded_keys = copy.copy(self.keys)

        # Update keys
        self.loaded_keys.update((k,v) for k,v in user_keys.items() if k in self.keys)

        print("User hotkeys loaded")
    
    def qshortcut_to_pynput(qshortcut_str):
        qshortcut_str = qshortcut_str.lower()

        parts = qshortcut_str.split("+")

        for i, part in enumerate(parts):
            if len(parts[i]) > 1:
                if parts[i] not in ("ctrl", "shift", "alt"):
                    key = getattr(pynput.keyboard.Key, parts[i])
                    parts[i] = f'{key.value.vk}'
                
                parts[i] = f'<{parts[i]}>'

        return "+".join(parts)

TSHHotkeys.instance = TSHHotkeys()