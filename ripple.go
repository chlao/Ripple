package main

import(
	"bufio"
	"os"
	"log"
	"strings"
	"regexp"
	"net/http"
	"database/sql"
	_ "github.com/lib/pq"
	//_ "github.com/mattn/go-sqlite3"
	"encoding/json"
	"github.com/gorilla/mux"
)

func main(){
	port := os.Getenv("PORT") 

	if port == "" {
		port = "3000"
	}

	db := NewDB()

	r := mux.NewRouter()

	r.Handle("/ip", GetIP(db)).Methods(http.MethodGet)
	r.Handle("/logs/{id}", ReadLogs(db)).Methods(http.MethodGet)

	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("./public"))))
	
	log.Println("Listening...")

	http.ListenAndServe(":" + port, r)
}

func checkErr(err error){
	if err != nil {
		log.Fatal(err)
        panic(err)
    }
}

func NewDB() *sql.DB {
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	//db, err := sql.Open("sqlite3", "./ripple.db")
    checkErr(err)

    return db
}

func insertLogs(db *sql.DB){
	// Get the request logs 
    logs, err := processFile("logs.txt")
    checkErr(err)

	//stmt, err := db.Prepare("INSERT OR IGNORE INTO requests (request_id, timestamp, fwd) VALUES(?, ?, ?)")
    stmt, err := db.Prepare("INSERT INTO requests (request_id, timestamp, fwd) VALUES($1,$2,$3) ON CONFLICT DO NOTHING")
	checkErr(err)	

    defer stmt.Close()

    re_timestamp := regexp.MustCompile("([0-9]{4})-([0-9]{2})-([0-9]{2})\\s([0-9]{2}):([0-9]{2}):([0-9]{2})\\.([0-9]{6})")
    re_requestid := regexp.MustCompile("request_id=([a-z0-9]+)-([a-z0-9]+)-([a-z0-9]+)-([a-z0-9]+)-([a-z0-9]+)")
    re_fwd := regexp.MustCompile("fwd=\"([0-9]+)\\.([0-9]+)\\.([0-9]+)\\.([0-9]+)")

    // Add the request logs to the db 
    for _, content := range logs{
    	timestamp := re_timestamp.FindString(content) 
    	request_id := re_requestid.FindString(content)[11:]
    	fwd := re_fwd.FindString(content)

    	fwd = fwd[5:len(fwd)]

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

type IPAddresses struct{
	Fwd []string
}

func GetIP(db *sql.DB) http.Handler{
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := db.Exec("DROP TABLE IF EXISTS requests")
	    checkErr(err)

	    _, err = db.Exec("CREATE TABLE IF NOT EXISTS requests(request_id text primary key, timestamp text, fwd text)")
	    checkErr(err)

	    insertLogs(db)

		w.Header().Set("Content-Type", "application/json")	

		ip := make([]string, 0)
		var ipAddress string

		// Return a list of IP addresses to client side 
		rows, err := db.Query("SELECT DISTINCT fwd FROM requests ORDER BY fwd ASC")
		checkErr(err)

		defer rows.Close()

		for rows.Next(){
			rows.Scan(&ipAddress)
			ip = append(ip, ipAddress)
		}

		data := IPAddresses{Fwd: ip}
		json.NewEncoder(w).Encode(data)	
	})
}

type Timestamps struct{
	Timestamp [] string
}
 
func ReadLogs(db *sql.DB) http.Handler{
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Return logs to the client side 
		err := r.ParseForm()
		checkErr(err)

		split := strings.Split(r.URL.String(), "/")
		ip := split[len(split) - 1]

		rows, err := db.Query("SELECT timestamp FROM requests WHERE fwd=\"" + ip + "\"")
		checkErr(err)

		timestamps := make([]string, 0)
		var timestamp string;

		for rows.Next(){
			rows.Scan(&timestamp)
			timestamps = append(timestamps, timestamp)
		}

		data := Timestamps{timestamps}
		json.NewEncoder(w).Encode(data)	
	})
}