import json
print("1")
import iofabric.client
print("2")
import iofabric.iomessage
print("3")
import os
print("4")
import time
print("5")

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


print("6")

host = iofabric.client.get_host();
print("7")
print(host);
print("8")

listener = IoFabricListener();
print("9")
uri = "ws://" + host + ":54321/v2/control/socket/id/" + CONTAINER_ID;
print(uri);
msgClient = iofabric.client.Client(uri, listener, CONTAINER_ID);
print("10")
msgClient.connect();
print("11")
ctlClient = iofabric.client.Client("ws://" + host + ":54321/v2/control/socket/id/" + CONTAINER_ID, listener, CONTAINER_ID);
print("12")
ctlClient.connect();
print("13")


content ="{\"payload\" : \"abcd\"}";
while True:
    print(content);
    time.sleep(2);

    msg=iofabric.iomessage.IoMessage();
    msg.infotype="ctrl/ping";
    msg.infoformat="integer/Byte";
    msg.contentdata=content;

