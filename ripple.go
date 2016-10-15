package main

import{
	"os"
	"net/http"
	_ "github.com/mattn/go-sqlite3"
}

func main(){
	port := os.Getenv("PORT") 

	if port == "" {
		port = "3000"
	}

	http.Handle("/", http.FileServer(http.Dir("./public")))
	
}