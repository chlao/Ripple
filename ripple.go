package main

import(
	"bufio"
	"os"
	"log"
	"strings"
	"net/http"
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	//"github.com/elgs/gosqljson"
)

func main(){
	port := os.Getenv("PORT") 

	if port == "" {
		port = "3000"
	}

	db := NewDB()

	http.Handle("/", http.FileServer(http.Dir("./public")))
	//http.Handle("/logs", handlerLogs); 
	
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
    
    /*
    _, err = db.Exec("DROP TABLE requests)
    checkErr(err)
    */

    _, err = db.Exec("CREATE TABLE IF NOT EXISTS requests(request_id integer primary key, timestamp text, fwd text)")
    checkErr(err)

    // Get the request logs 
    logs, err := processFile("logs.txt")
    checkErr(err)

    // Add the request logs to the db 
    for i, content := range logs{
    	request := strings.Split(logs[i], " ") 
    }

    return db
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

func ReadLogs(db *sql.DB) http.Handler{
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

	})
}