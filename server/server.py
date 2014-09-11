# -*- coding: utf-8 -*-
################################################################################
#                                                                              #
#                                   CHaServer                                  #
#                                 -- Server --                                 #
#                                                                              #
################################################################################
import websocket
import json
import socket
import multiprocessing
import re
import time
import traceback
import urllib
from datetime import datetime


host = '127.0.0.1'
port = 3000



def encode_for_socketio(message):
	"""
	Encode 'message' string or dictionary to be able
	to be transported via a Python WebSocket client to 
	a Socket.IO server (which is capable of receiving 
	WebSocket communications). This method taken from 
	gevent-socketio.
	"""
	MSG_FRAME = "~m~"
	HEARTBEAT_FRAME = "~h~"
	JSON_FRAME = "~j~"

	if isinstance(message, basestring):
		encoded_msg = message
	elif isinstance(message, (object, dict)):
		return encode_for_socketio(JSON_FRAME + json.dumps(message))
	else:
		raise ValueError("Can't encode message.")

	return MSG_FRAME + str(len(encoded_msg)) + MSG_FRAME + encoded_msg











unix_time = int(time.mktime(datetime.now().timetuple()))

url = "http://%s:%d/socket.io/?EIO=3&transport=polling&t=%d-0" % (host, port, unix_time)
u = urllib.urlopen(url)
sid = None
#if u.getcode() == 200:
response = u.readline()
r = re.compile("({.*})")
m = r.search(response).group(0)
j = json.loads(m)
sid = j['sid']

print sid
ws_url = "ws://%s:%d/socket.io/?EIO=3&transport=websocket&sid=%s" % (host, port, sid)
print ws_url

ws = websocket.create_connection(ws_url)
ws.send(encode_for_socketio('Hello!!!'))
print ws.recv()
ws.close()
	
time.sleep(5)
exit()







def handshake(host, port):
	u = urllib.urlopen("http://%s:%d/socket.io/1/" % (host, port))
	print u
	if u.getcode() == 200:
		response = u.readline()
		(sid, hbtimeout, ctimeout, supported) = response.split(":")
		supportedlist = supported.split(",")
		if "websocket" in supportedlist:
			return (sid, hbtimeout, ctimeout)
		else:
			raise 'mz'
	else:
		print "mazui"

def encode_for_socketio(message):
	"""
	Encode 'message' string or dictionary to be able
	to be transported via a Python WebSocket client to 
	a Socket.IO server (which is capable of receiving 
	WebSocket communications). This method taken from 
	gevent-socketio.
	"""
	MSG_FRAME = "~m~"
	HEARTBEAT_FRAME = "~h~"
	JSON_FRAME = "~j~"

	if isinstance(message, basestring):
		encoded_msg = message
	elif isinstance(message, (object, dict)):
		return encode_for_socketio(JSON_FRAME + json.dumps(message))
	else:
		raise ValueError("Can't encode message.")

	return MSG_FRAME + str(len(encoded_msg)) + MSG_FRAME + encoded_msg



#(sid, hbtimeout, ctimeout) = handshake('127.0.0.1', 3000)

#ws = websocket.create_connection("ws://%s:%d/socket.io/1/websocket/%s" % ('127.0.0.1', 3000, sid))
ws = websocket.create_connection("ws://192.168.1.14:3000/socket.io/?EIO=3&transport=websocket&sid=c_CGZ_CgQEwlh4zEAAAB")
ws.send(encode_for_socketio('Hello!!!'))
ws.send(encode_for_socketio({'event':'serverHello', 'name':'test'}))
print ws.recv()
ws.close()

exit()






#--------------------------------------#
#             Player class             #
#--------------------------------------#
class Player:
	def __init__(self, side, port, host):
		sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
		sock.bind((host, port))
		sock.listen(1)
		
		self.side = side
		self.port = port
		self.sock = sock
		self.r = re.compile("[wlsp][rlup]")
		
	def accept(self):
		conn, addr = self.sock.accept()
		self.conn = conn
		self.addr = addr
		
	def name(self):
		name = self.conn.recv(32)
		if name == "":
			self.name = 'COOL' if self.side == 'C' else 'HOT'
		else:
			self.name = name
		
	def gr(self):
		str = self.__recv()
		if str != "gr": return false
		return true
	
	def cmd(self):
		str = self.__recv()
		if self.r.match(str) is None: return None
		return str
	
	def __recv(self):
		str = self.conn.recv(4)
		if len(str) < 2: return None
		return str[0:2]


#--------------------------------------#
#             Server class             #
#--------------------------------------#
class Server:
	def __init__(self):
		self.now = None
		self.ws = None
		self.cool = None
		self.hot = None

	def prepare(self, url, name, c_port, h_port, host):
		print "つなぐぞい!"
		self.ws = websocket.create_connection(url)
		self.ws.send(encode_for_socketio('Hello!!!'))
		self.ws.send(json.dumps({'event':'serverHello', 'name':name}))
		print "おくったぞい！"
	
		self.cool = Player('C', c_port, host)
		self.hot = Player('H', h_port, host)
		
		for p in [ self.cool, self.hot ]: p.accept()
		for p in [ self.cool, self.hot ]:
			self.now = p
			p.name()
			self.ws.send(json.dumps({'event':'clientHello', 'side':p.side, 'name':p.name, 'addr':p.addr[0], 'port':p.addr[1]}))

		# Wait for manager
		recv = self.ws.recv()
		if recv != "start": raise SyntaxError

	def zoi(self):
		run_flg = True
		while run_flg:
			for p in [ self.cool, self.hot ]:
				self.now = p
			
				# Notification of turn
				p.conn.sendall("@\r\n")
			
				# getready
				if not p.gr(): raise SyntaxError
				run_flg = self.__exchange(p, 'gr')
				
				# cmd
				cmd = p.cmd()
				if cmd is None: raise SyntaxError
				run_flg = exchange(p, cmd)
				
				# Check the receive
				if p.conn.recv(3) != "#\r\n": raise SyntaxError
	
	def __exchange(self, p, cmd):
		self.ws.send(json.dumps({'event':'clientRequest', 'side':p.side, 'cmd':cmd}))
		recv = self.ws.recv()
		if len(recv) != 10: raise SyntaxError
		p.conn.sendall(recv)
		return recv[0] == '1'
		
	def error(self, err):
		if self.ws is not None:
			self.ws.send(json.dumps({'event':'clientError', 'side':self.now.side, 'msg':err}))
	
	def cleanup(self):
		if self.ws is not None:
			#self.ws.send(json.dumps({'event':'serverFinished'}))
			self.ws.close()
		
		for p in [ self.cool, self.hot ]: 
			if p is not None: p.conn.close()


#--------------------------------------#
#                 Main                 #
#--------------------------------------#
if __name__ == '__main__':
	# Configuration
	URL = 'ws://127.0.0.1:3000/socket.io/?transport=websocket'
	NAME = '練習場1'
	

	HOST = '127.0.0.1'
	COOL_PORT = 40000
	HOT_PORT = 50000

	# Game start
	while True:
		game = Server()
		try:
			game.prepare(URL, NAME, COOL_PORT, HOT_PORT, HOST)
			game.zoi()
		except socket.error:
			game.error('Socket Error')
			print traceback.format_exc()
		except SyntaxError:
			game.error('Command Error')
			print traceback.format_exc()
		except Exception:
			game.error('Unknown Error')
			print traceback.format_exc()
		finally:
			game.cleanup()
			time.sleep(5)
