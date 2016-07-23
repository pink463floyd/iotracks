import json
import iofabric.client
import iofabric.iomessage
import os
import time

confg=None
msgClient=None
ctrlClient=None

CONTAINER_ID="NOT_DEFINED"
if 'SELFNAME' in os.environ:
   CONTAINER_ID=os.environ['SELFNAME']

print(CONTAINER_ID)

class IoFabricListener:

  def onConnected(self):
    return

  def onClosed(self):
    return

  def onMessage(self, msg):
    print msg

  def onUpdateConfig(self, new_config):
   print(new_config);
   config=new_config;


host = iofabric.client.get_host();
listener = IoFabricListener();
msgClient = iofabric.client.Client("ws://" + host + ":54321/v2/control/socket/id" + CONTAINER_ID, listener, CONTAINER_ID);
msgClient.connect();
ctlClient = iofabric.client.Client("ws://" + host + ":54321/v2/control/socket/id" + CONTAINER_ID, listener, CONTAINER_ID);
ctlClient.connect();



content ="{\"payload\" : \"abcd\"}";
while True:
    print(content);
    time.sleep(2);
    msg=iofabric.iomesssage.IoMessage();
    msg.infotype="ctrl/ping";
    msg.infoformat="integer/Byte";
    msg.contentdata=content;
