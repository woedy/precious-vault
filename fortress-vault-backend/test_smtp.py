import smtplib
import ssl
from email.mime.text import MIMEText

# Configuration from .env
EMAIL_HOST = 'smtp.mail.att.net'
EMAIL_PORT = 587
EMAIL_USER = 'preciousvault@att.net'
# I'll use the password from .env but I won't print it.
EMAIL_PASS = 'fakbtdwbvygkzove' 

def test_connection_587():
    print(f"Testing {EMAIL_HOST}:{EMAIL_PORT} with STARTTLS...")
    try:
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=10)
        server.set_debuglevel(1)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        print("Login successful on 587!")
        server.quit()
        return True
    except Exception as e:
        print(f"Failed on 587: {e}")
        return False

def test_connection_465():
    print(f"\nTesting {EMAIL_HOST}:465 with SSL...")
    try:
        context = ssl.create_default_context()
        server = smtplib.SMTP_SSL(EMAIL_HOST, 465, context=context, timeout=10)
        server.set_debuglevel(1)
        server.login(EMAIL_USER, EMAIL_PASS)
        print("Login successful on 465!")
        server.quit()
        return True
    except Exception as e:
        print(f"Failed on 465: {e}")
        return False

if __name__ == "__main__":
    success_587 = test_connection_587()
    success_465 = test_connection_465()
    
    if not success_587 and not success_465:
        print("\nBoth connection attempts failed. This might be due to incorrect credentials, IP blocking, or server-side issues.")
