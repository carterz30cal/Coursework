from hashlib import sha256

password = "testing"
salt = "1111"

concat = f"{password}{salt}"
m = sha256()
m.update(bytes(concat,"utf-8"))
print(m.hexdigest())
