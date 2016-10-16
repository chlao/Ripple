package main

import(
	"bufio"
	"os"
	"log"
	//"strings"
	"regexp"
	"net/http"
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"github.com/elgs/gosqljson"
	"encoding/json"
)

func main(){
	port := os.Getenv("PORT") 

	if port == "" {
		port = "3000"
	}

	db := NewDB()

	http.Handle("/", http.FileServer(http.Dir("./public")))
	http.Handle("/ip", GetIP(db)); 
	http.Handle("/logs", ReadLogs(db)); 
	
	log.Println("Listening...")

	http.ListenAndServe(":" + port, nil)
}

func checkErr(err error){
	if err != nil {
		/* Panic is a built-in function that stops the ordinary flow of control and begins panicking. 
		When the function F calls panic, execution of F stops, any deferred functions in F are executed normally, 
		and then F returns to its caller. To the caller, F then behaves like a call to panic. 
		The process continues up the stack until all functions in the current goroutine have returned, 
		at which point the program crashes.
		*/
		log.Fatal(err)
        panic(err)
    }
}

func NewDB() *sql.DB {
	db, err := sql.Open("sqlite3", "./ripple.db")
    checkErr(err)
    
    _, err = db.Exec("DROP TABLE IF EXISTS requests")
    checkErr(err)

    _, err = db.Exec("CREATE TABLE IF NOT EXISTS requests(request_id text primary key, timestamp text, fwd text)")
    checkErr(err)

    insertLogs(db)

    return db
}

func insertLogs(db *sql.DB){
	// Get the request logs 
    logs, err := processFile("logs.txt")
    checkErr(err)

    stmt, err := db.Prepare("INSERT INTO requests (request_id, timestamp, fwd) VALUES(?, ?, ?)")
	checkErr(err)	

    defer stmt.Close()

    re_timestamp := regexp.MustCompile("([0-9]{4})-([0-9]{2})-([0-9]{2})\\s([0-9]{2}):([0-9]{2}):([0-9]{2})\\.([0-9]{6})")
    re_requestid := regexp.MustCompile("request_id=([a-z0-9]+)-([a-z0-9]+)-([a-z0-9]+)-([a-z0-9]+)-([a-z0-9]+)")
    re_fwd := regexp.MustCompile("fwd=\"([0-9]+)\\.([0-9]+)\\.([0-9]+)\\.([0-9]+)")

    // Add the request logs to the db 
    for _, content := range logs{
    	timestamp := re_timestamp.FindString(content) //content[:27]
    	request_id := re_requestid.FindString(content)[11:]
    	fwd := re_fwd.FindString(content)

    	fwd = fwd[5:len(fwd)]

    	log.Println(timestamp)
    	log.Println(request_id)
    	log.Println(fwd)

    	_, err = stmt.Exec(request_id, timestamp, fwd)
		checkErr(err) 
    }
}

func processFile(fileName string) ([]string, error) {
	file, err := os.Open(fileName)
	checkErr(err)

	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return lines, scanner.Err()
}

func GetIP(db *sql.DB) http.Handler{
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")	

		data, err := gosqljson.QueryDbToMap(db, "", "SELECT DISTINCT fwd FROM requests")
		checkErr(err)

		json.NewEncoder(w).Encode(data)	

		// Return a list of IP addresses to client side 
		//rows, err := db.Query("SELECT DISTINCT fwd FROM requests")
		//checkErr(err)


	})
}

func ReadLogs(db *sql.DB) http.Handler{
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Return logs to the client side 

	})
}