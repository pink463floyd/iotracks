import iofabric.client
import iofabric.iomessage
import os
import time
import random

config=None
msgClient=None
ctlClient=None

CONTAINER_ID="NOT_DEFINED"
if 'SELFNAME' in os.environ:
    CONTAINER_ID=os.environ['SELFNAME']

class IoFabricListener:

    def onConnected(self):
        return

    def onClosed(self):
        return

    def onMessage(self, msg):
        return

    def onUpdateConfig(self, new_config):
        config=new_config

host = iofabric.client.get_host();

listener = IoFabricListener()
msgClient = iofabric.client.Client("ws://" + host + ":54321/v2/control/socket/id/" + CONTAINER_ID, listener, CONTAINER_ID)
msgClient.connect()

ctlClient = iofabric.client.Client("ws://" + host + ":54321/v2/message/socket/id/" + CONTAINER_ID, listener, CONTAINER_ID)
ctlClient.connect()

while True:
    print("sleep");
    time.sleep(2)
    msg=iofabric.iomessage.IoMessage()
    msg.infotype="temperature"
    msg.infoformat="decimal/celcius"
    msg.contentdata="50";
    msgClient.send_message(msg)

