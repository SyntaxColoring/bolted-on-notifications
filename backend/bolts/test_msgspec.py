import msgspec

print(msgspec.json.decode(b'[1, 2, 2]', type=set[int]))
