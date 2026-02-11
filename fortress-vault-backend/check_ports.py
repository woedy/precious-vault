import socket

def check_port(host, port):
    try:
        s = socket.create_connection((host, port), timeout=5)
        print(f"Port {port} on {host} is OPEN")
        s.close()
    except Exception as e:
        print(f"Port {port} on {host} is CLOSED: {e}")

if __name__ == "__main__":
    host = "smtp.mail.att.net"
    for port in [25, 465, 587]:
        check_port(host, port)
