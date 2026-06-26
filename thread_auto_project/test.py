import os

threads_secret = os.environ.get('thread_api_key', '3306')

print(threads_secret)
