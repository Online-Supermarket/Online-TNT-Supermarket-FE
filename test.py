import urllib.request, json
req1 = urllib.request.Request("http://localhost:8081/auth/token", data=json.dumps({"email": "admin@marketflow.local", "password": "Password123!"}).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    token = json.loads(urllib.request.urlopen(req1).read())['token']
    req2 = urllib.request.Request("http://localhost:8080/api/order/reports/sales", headers={'Authorization': 'Bearer ' + token})
    res = json.loads(urllib.request.urlopen(req2).read())
    print([o for o in res['orders'] if 'a34980c4' in o['id']])
except Exception as e:
    print(e)
