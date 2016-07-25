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
import urllib2
import json


confg=None
msgClient=None
ctrlClient=None

CONTAINER_ID="NOT_DEFINED"
if 'SELFNAME' in os.environ:
   CONTAINER_ID=os.environ['SELFNAME']

print(CONTAINER_ID)


class IoFabricListener:

  def onConnected(self):
    print("CONNECTED");
    bo = open("connected.txt", "wb")
    bo.write( "CONNECTED\n");
    bo.close()
    return

  def onClosed(self):
    print("CLOSED");
    return

  def onMessage(self, msg):
    co = open("message.txt", "wb")
    co.write( "message\n");
    co.close()
    print("MESSAGE");
    print msg

  def onUpdateConfig(self, new_config):
   print("CONFIG");
   print(new_config);
   config=new_config;
   fo = open("config.txt", "wb")
   fo.write( "Python is a great language.\nYeah its great!!\n");
   fo.write(new_config);
   fo.write( "Python is a great language.\nYeah its great!!\n");
   fo.close()



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

sendCount=0;
content ="{\"payload\" : \"abcd\"}";
while True:
    print(content);
    time.sleep(2);

    msg=iofabric.iomessage.IoMessage();
    msg.infotype="ctrl/ping";
    msg.infoformat="integer/Byte";
    msg.contentdata=content;
    msgClient.send_message(msg);
    go = open("send.txt", "wb")
    sendCount = sendCount + 1;
    go.write( "Python is a great language:(%d)\nYeah its great!!\n" % sendCount);
    print( "Python is a great language:(%d)\nYeah its great!!\n" % sendCount);
    req = urllib2.Request("http://" + host + ":54321/v2/config/get", "{\"id\":\"" + CONTAINER_ID + "\"}", {'Content-Type': 'application/json'})
    response = urllib2.urlopen(req)
    print(json.loads(response.read()))

    go.close();

