import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=2753,
    database="comprass",
    user="postgres",
    password="123456"
)

print("CONEXÃO OK!")
conn.close()