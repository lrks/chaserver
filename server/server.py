# -*- coding: utf-8 -*-
################################################################################
#                                                                              #
#                                   CHaServer                                  #
#                                 -- Server --                                 #
#                                                                              #
################################################################################
import socket
import multiprocessing
import re
import time
import traceback
import random
import string
import requests
import json


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
		self.r = re.compile("[wlsp][rlud]")
		
	def accept(self):
		conn, addr = self.sock.accept()
		self.conn = conn
		self.addr = addr
		
	def nameget(self):
		name = self.conn.recv(32)
		if name == "":
			self.name = 'COOL' if self.side == 'C' else 'HOT'
		else:
			self.name = name
		
	def gr(self):
		str = self.__recv()
		if str != "gr": return False
		return True
	
	def cmd(self):
		str = self.__recv()
		if self.r.match(str) is None: return None
		return str
	
	def __recv(self):
		str = self.conn.recv(4)
		print 'RECV!', str
		if len(str) < 2: return None
		return str[0:2]


#--------------------------------------#
#             Server class             #
#--------------------------------------#
class Server:
	def __init__(self, id):
		self.now = None
		self.cool = None
		self.hot = None
		self.id = id

	def prepare(self, url, name, c_port, h_port, host):
		self.url = url
		self.__http('POST', 'serverHello', {'name':name})
	
		self.cool = Player('C', c_port, host)
		self.hot = Player('H', h_port, host)
		
		for p in [ self.cool, self.hot ]:
			p.accept()
			self.__http('POST', 'clientHello', {'side':p.side, 'addr':p.addr[0], 'port':p.addr[1]})
		for p in [ self.cool, self.hot ]:
			self.now = p
			p.nameget()
			self.__http('POST', 'clientHello', {'side':p.side, 'name':p.name})

		# Wait for manager
		while self.__http('GET', 'isStart')['flg'] != 1:
			# ごめんなさい
			time.sleep(1)
		
		self.__http('POST', 'serverStart')

	def zoi(self):
		cool_end = False
		hot_end = False
	
		while not (cool_end and hot_end):
			for p in [ self.cool, self.hot ]:
				if cool_end and p == self.cool: continue
				if hot_end and p == self.hot: continue
				self.now = p
				
				# Notification of turn
				p.conn.sendall("@\r\n")
				
				# getready
				if not p.gr(): raise SyntaxError
				if not self.__exchange(p, 'gr'):
					if p == self.cool:
						cool_end = True
					else:
						hot_end = True
					break
				
				#  cmd
				cmd = p.cmd()
				if cmd is None: raise SyntaxError
				time.sleep(1)
				run_flg = self.__exchange(p, cmd)
				if not run_flg:
					if p == self.cool:
						cool_end = True
					else:
						hot_end = True
					break
					
				# Check the receive
				if p.conn.recv(3) != "#\r\n": raise SyntaxError

	
	def __exchange(self, p, cmd):
		recv = self.__http('POST', 'clientRequest', {'side':p.side, 'cmd':cmd})['result']
		if len(recv) != 10: raise SyntaxError
		print p, cmd, recv
		p.conn.sendall(recv + "\r\n")
		print "お返事", recv
		return recv[0] == '1'
	
	def __http(self, method, path, query=None):
		url = "%s%s" % (self.url, path)
		if query is None: query = {}
		query.update({'id':self.id})
		print url, query
		if method == 'POST':
			r = requests.post(url, data=query)
		else:
			r = requests.get(url, params=query)
		print r, r.text
		return json.loads(r.text)
		
	def error(self, err):
		print err
		self.__http('POST', 'clientError', {'side':self.now.side, 'msg':err})
	
	def cleanup(self):
		self.__http('POST', 'serverDisconnect')
		
		for p in [ self.cool, self.hot ]: 
			if (p is not None) and (p.conn is not None): p.conn.close()


#--------------------------------------#
#                 Main                 #
#--------------------------------------#
if __name__ == '__main__':
	# Configuration
	URL = 'http://127.0.0.1:3000/'
	NAME = '練習場1'
	#ID = ''.join([random.choice(string.ascii + string.digits) for i in range(16)])
	ID = 'testserver'
	
	HOST = '0.0.0.0'
	COOL_PORT = 40000
	HOT_PORT = 50000

	# Game start
	while True:
		game = Server(ID)
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
