from picamera import PiCamera
from time import sleep
import subprocess
import os

camera =PiCamera()
camera.resolution = (1000,1000)

def snap(filename, text):
    camera.annotate_text = text
    camera.start_preview()
    sleep(2)
    #import pdb; pdb.set_trace()
    try:
        camera.capture(filename)
    except IOError:
        print("directory not found, trying to create...")
        subprocess.call(["mkdir",filename[:-17]])
        camera.capture(filename)

    camera.stop_preview()
    print("Image saved: " + filename)


    return 1
