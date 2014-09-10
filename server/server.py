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
		self.ws = websocket.create_connection(url)
		self.ws.send(json.dumps({'event':'serverHello', 'name':name}))
	
		self.cool = Player('C', c_port, host)
		self.hot = Player('H', h_port, host)
		
		for p in [ self.cool, self.hot ]: p.accept()
		for p in [ self.cool, self.hot ]:
			self.now = p
			p.name()
			self.ws.send(json.dumps({'event':'clientHello', 'side':p.side, 'name':p.name, 'addr':p.addr[0], 'port':p.addr[1]}))

		# Wait for manager
		recv = ws.recv()
		if recv != "start": raise SyntaxError

	def zoi(self):
		run_flg = True
		while run_flg:
			for p in [ self.cool, self.hot ]:
				self.now = p
			
				# Notification of turn
				p.conn.sendall('@')
			
				# getready
				if not p.gr(): raise SyntaxError
				run_flg = self.__exchange(p, 'gr')
				
				# cmd
				cmd = p.cmd()
				if cmd is None: raise SyntaxError
				run_flg = exchange(p, cmd)
				
				# Check the receive
				if p.conn.recv(1) != '#': raise SyntaxError
	
	def __exchange(p, cmd):
		self.ws.send(json.dumps({'event':'clientRequest', 'side':p.side, 'cmd':cmd}))
		recv = self.ws.recv()
		if len(recv) != 10: raise SyntaxError
		p.conn.sendall(recv)
		return recv[0] == '1'
		
	def error(err):
		if self.ws is not None:
			self.ws.send(join.dumps({'event':'clientError', 'side':self.now.side, 'msg':error}))
	
	def clean_up(self):
		if self.ws is not None:
			#self.ws.send(join.dumps({'event':'serverFinished'}))		
			self.ws.close()
		
		for p in [ self.cool, self.hot ]: 
			if p is not None: p.conn.close()


#--------------------------------------#
#                 Main                 #
#--------------------------------------#
if __name__ == '__main__':
	# Configuration
	URL = 'ws://localhost:30000/'
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
