import json
import iofabric.client
import iofabric.iomessage
import os
import time
import urllib2
import json


confg=None
msgClient=None
ctrlClient=None

CONTAINER_ID="NOT_DEFINED"
if 'SELFNAME' in os.environ:
   CONTAINER_ID=os.environ['SELFNAME']

class IoFabricListener:

  def onConnected(self):
    print("CONNECTED");
    req = urllib2.Request("http://" + host + ":54321/v2/config/get", "{\"id\":\"" + CONTAINER_ID + "\"}", {'Content-Type': 'application/json'})
    response = urllib2.urlopen(req)
    print(json.loads(response.read()))
    return

  def onClosed(self):
    print("CLOSED");
    return

  def onMessage(self, msg):
    print("MESSAGE");
    print msg

  def onUpdateConfig(self, new_config):
   print("CONFIG");
   print(new_config);
   config=new_config;



host = iofabric.client.get_host();

listener = IoFabricListener();
uri = "ws://" + host + ":54321/v2/control/socket/id/" + CONTAINER_ID;
msgClient = iofabric.client.Client(uri, listener, CONTAINER_ID);
msgClient.connect();
ctlClient = iofabric.client.Client(uri + CONTAINER_ID, listener, CONTAINER_ID);
ctlClient.connect();
'''
while True:
    print("sleeping");
    time.sleep(2);

    req = urllib2.Request("http://" + host + ":54321/v2/messages/next", "{\"id\":\"" + CONTAINER_ID + "\"}", {'Content-Type': 'application/json'})

    response = urllib2.urlopen(req)

    print(json.loads(response.read()))
'''
