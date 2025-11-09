#!/usr/bin/python3
import libevdev
from time import sleep

# Creation et parametrage du device
device = libevdev.Device()
device.name = 'Fake keyboard'
device.enable(libevdev.EV_KEY.KEY_A)
device.enable(libevdev.EV_KEY.KEY_B)

uinput = device.create_uinput_device()

# Le kernel a besoin d'une seconde avant l'envoi du premier évenement
sleep(1)
