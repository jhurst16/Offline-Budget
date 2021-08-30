let db;
const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    //auto increment primary key
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

//function for submitting new transaction while offline
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_transaction');

    budgetObjectStore.add(record);
}

function uploadBudget() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_transaction');

    // set store records to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        // send new data to api
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    //open one more transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_transaction');
                    budgetObjectStore.clear();

                    alert('Saved and submitted transaction!')
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}
// event listener for reconnecting to online
window.addEventListener('online', uploadBudget);