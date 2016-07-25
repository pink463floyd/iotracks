from ws4py.client.threadedclient import WebSocketClient
import threading
import iomessage
import urllib2
import json
import os


NEW_MESSAGE=13
RECEIPT=14
ACK=11
CONTROL=12

class Client(WebSocketClient):
    def __init__(self, url, listener, container_id):
        super(Client, self).__init__(url)
        self.listener=listener
        self.url=url
        self.container_id=container_id

    def opened(self):
        print("CLIENT.PY: OPENED!!!");
        self.listener.onConnected()

    def closed(self, code, reason=None):
        self.listener.onClosed()


    def received_message(self, m):
        print("CLIENT.PY: RCV!!!");
        msg_data=bytearray(m.data[5:])
        #msg_data=m.data
        if len(msg_data) == 0:
            return
        opt_code=bytearray(m.data)[0]
        if opt_code == NEW_MESSAGE:
            msg=iomessage.bytes2message(msg_data)
            self.send(bytearray([ACK]), binary=True)
            self.listener.onMessage(msg)
        if opt_code == ACK:
            print "ACK recieved."
        if opt_code == RECEIPT:
            self.send(bytearray([ACK]), binary=True)
        if opt_code == CONTROL:
            req = urllib2.Request("http://" + get_host() + ":54321/v2/config/get", "{\"id\":\"" + self.container_id + "\"}", {'Content-Type': 'application/json'})
            response = urllib2.urlopen(req)
            self.send(bytearray([ACK]), binary=True)
            self.listener.onUpdateConfig(json.loads(response.read()))

    def send_message(self, msg):
        raw_data=bytearray()
        raw_data+=bytearray([NEW_MESSAGE])
        raw_data+=iomessage.message2bytes(msg)
        self.send(raw_data, binary=True)

    def connect(self):
        super(Client, self).connect()
        self.worker = threading.Thread(target=worker, args=(self,))
        self.worker.start()


def worker(client):
    client.run_forever()

def get_host():
    response = os.system("ping -c 1 " + "iofabric")
    if response == 0:
        return "iofabric"
    else:
        return "127.0.0.1"
