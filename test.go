package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	loginData := map[string]string{"email": "admin@marketflow.local", "password": "Password123!"}
	jsonData, _ := json.Marshal(loginData)
	resp, err := http.Post("http://localhost:8081/auth/token", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("Error logging in:", err)
		return
	}
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)
	var loginResp map[string]interface{}
	json.Unmarshal(body, &loginResp)
	token := loginResp["token"].(string)

	req, _ := http.NewRequest("GET", "http://localhost:8080/api/order/reports/sales", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{}
	resp2, err := client.Do(req)
	if err != nil {
		fmt.Println("Error fetching sales:", err)
		return
	}
	defer resp2.Body.Close()
	body2, _ := ioutil.ReadAll(resp2.Body)
	fmt.Println(string(body2)[:200])
}
