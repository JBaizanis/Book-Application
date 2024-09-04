const sqlite3 = require('sqlite3').verbose(); // Κάνω import το sqlite3 module.
const db = new sqlite3.Database('books.db'); // Δημιουργώ ένα νέο αντικείμενο sqlite και συνδέομαι στο αρχείο books.db.

class Book{ // Δημιουργώ μια κλάση Book που περιέχει όλες τις στήλες που περιέχει ο πίνακας της βάσης.
    constructor(id,author,title,genre,price){
        this.id=id;
        this.author=author;
        this.title=title;
        this.genre=genre;
        this.price=price;
    }
}

async function addBook(db, book) {
  try {
    const selectQuery = `SELECT * FROM books WHERE title = "${book.title}" AND author = "${book.author}"`; // Ψάχνω να βρω αν υπάρχει βιβλίο με τον τίτλο και τον συγγράφεα του βιβλίου που θέλει να βάλει ο χρήστης.
    const row = await new Promise((resolve, reject) => {
      db.get(selectQuery, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (row) { // Αν επιστραφούν γραμμές τότε υπάρχει ήδη στην βάση βιβλίο με όνομα συγγραφέα και τίτλο που ο χρήστης επιχειρεί να ξανακαταχωρήσει, οπότε δεν καταχώρειται το βιβλίο.
      console.log('Book already exists in the Database!');
      return 1;
    } else { // Αν δεν επιστραφούν γραμμές τότε το βιβλίο μπορεί να εισαχθεί στην βάση.
      const insertQuery = `INSERT INTO books (author, title, genre, price) VALUES ("${book.author}", "${book.title}", "${book.genre}", ${book.price})`;
      await new Promise((resolve, reject) => {
        db.run(insertQuery, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log('Book ' + book.title + ' which has been written by ' + book.author + ', its genre is ' + book.genre + ', and it costs ' + book.price + '$ has been successfully added!'); 
      return 0;
    }
  } catch (err) {
    throw err;
  }
}

async function findBooks(db,keyword){
    const q = `SELECT * FROM books WHERE title LIKE '%${keyword}%'`; // Χρησιμοποιώ την λέξη κλειδί LIKE στο query και μετά βάζω το keyword που θέλω να ψάξω ανάμεσα σε % % και αυτό σημαίνει ότι θέλω ο τίτλος του βιβλίου να ξεκινά με οτιδήποτε, να τελειώνει με οτιδήποτε και να υπάρχει ανάμεσα η λέξη keyword που έδωσε ο χρήστης.
    const rows =  await Query(db,q); // Καλώ την συνάρτηση Query που εκτελεί το query.
    books=[]; // Δημιουργώ έναν άδειο πίνακα books.
    for(row of rows){
        book = new Book(row.id,row.author,row.title,row.genre,row.price); // Δημιουργώ ένα νέο αντικείμενο book όπου βάζω τις τιμές της τρέχουσας γραμμής row από αυτές που επέστρεψε η συνάρτηση Query.
        books.push(book); // Προσθέτω το object που δημιούργησα στον πίνακα books.
    }
    return books; // Επιστρέφω τον πίνακα με τα αποτέλεσματα.
}

function Query(db,q){
    return new Promise((resolve,reject)=>{
        db.all(q,(err,rows)=>{ // Η db.all καλείται για να εκτελέσει το query q.  
            if(err){ // Αν προκύψει σφάλμα εμφανίζεται μήνυμα λάθους στην κονσόλα.
                console.log('Error accessing the Database!');
                reject(err);
            }
            resolve(rows); // Αν το query τρέξει ομαλά, δηλαδή έγινε fullfil το promise επιστρέφεται το promissed result δηλαδή οι γραμμές.
        });
    });
}

const npmExpress = require('express'); // Κάνω import το express module.
const backend = npmExpress(); // Δημιουργώ ένα νέο Application object που θα χρησιμοποιηθεί για την διαχείρηση των HTTP requests.
const port  = 3000; // Θέτω το port από όπου θα 'ακούει' ο server στο 3000.
const parser = require('body-parser');
backend.use(parser.json());
const cors = require('cors');

backend.use(cors());

backend.use(npmExpress.static('public'));

backend.get('/books/:keyword', async (req,res)=>{
    try{
        const keyword = req.params.keyword; // Εξάγω το keyword parameter από το get request. 
        const books = await findBooks(db,keyword); // Καλώ την συνάρτηση findBooks προκειμένου να βρει αν υπάρχουν βιβλία όπου στον τίτλο τους περιέχουν την λέξη keyword που έδωσε ο χρήστης.
        res.json(books);
    }
    catch(err){
        res.status(500).send(err); // Αν προκύψει σφάλμα τότε θέτω το response status σε 500 και στέλνω το error σαν απάντηση.
    }
});

backend.post('/books',async (req,res)=>{
    const book = req.body; // Παίρνω τα δεδομένα από το body.
    try{
        const result = await addBook(db,book); // Καλώ την συνάρτηση addBook για να προσθέσω το βιβλίο(τα δεδομένα του βιβλίου, συγγραφέας,τίτλος,είδος,τιμή) στην βάση.
        res.json(result);
    }
    catch(err){
        res.status(500).send(err); // Αν προκύψει σφάλμα τότε θέτω το response status σε 500 και στέλνω το error σαν απάντηση.
    }
});

backend.listen(port); // Ξεκινάω τον server και τον υποχρεώνω να 'ακούει' στην τιμή του port που είναι 3000.