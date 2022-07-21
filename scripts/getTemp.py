import temperature as temp
import time
import os
import requests
import json

URL = 'http://cloud.jpnelson.ca/uploadTemp'

def uploadTemp(tempData, timeStr):
    myobj = {'datetime':timeStr, 
            'temperature':tempData}
    x = requests.post(URL, json = myobj)
    return

now = time.localtime()
timeStr = str(now[0]) + '-' + str(now[1]).zfill(2) + '-' + str(now[2]).zfill(2) + ' ' + str(now[3]).zfill(2) + ':' + str(now[4]).zfill(2) + ':' + str(now[5]).zfill(2)
datestamp = str(now[0]) +  '-' + str(now[1]).zfill(2) +  '-' + str(now[2]).zfill(2)
curTemp = temp.read_temp()[0]
uploadTemp(curTemp, timeStr)
print('Temperature uploaded: ' + str(curTemp))