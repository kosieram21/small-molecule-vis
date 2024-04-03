import Papa from 'papaparse';

class Element {
    #metadata;

    constructor(metadata) {
        this.#metadata = metadata;
    }

    getName() {
        return this.#metadata.Element;
    }

    getSymbol() {
        return this.#metadata.Symbol;
    }

    getGroup() {
        return this.#metadata.Group;
    }

    getAtomicNumber() {
        return this.#metadata.AtomicNumber;
    }
}

class PeriodicTable {
    static #instance;
    static #loadingPromise;
    static #loadCalled = false;
    
    #elements;

    constructor() {
        if (!PeriodicTable.#loadCalled || PeriodicTable.#instance) {
            throw new Error("Use PeriodicTable.load() to get an instance.");
        }

        this.#elements = {};
    }

    getElements() {
        return Object.values(this.#elements);
    }

    getElement(name) {
        return this.#elements[name];
    }

    static load() {
        if (!this.#instance) {
            this.#loadCalled = true;
            this.#instance = new this();
            this.#loadingPromise = new Promise((resolve, reject) => {
                fetch('/Periodic_Table_of_Elements.csv')
                    .then(response => response.text())
                    .then(text => {
                        Papa.parse(text, {
                            header: true,
                            complete: results => {
                                results.data.forEach(rowData => {
                                    const element = new Element(rowData);
                                    this.#instance.#elements[element.getName()] = element;
                                });
                                resolve(this.#instance);
                            },
                            error: error => reject(error)
                        });
                    }).catch(error => reject(error));
            });
        }

        return this.#loadingPromise;
    }
}

export default PeriodicTable;
