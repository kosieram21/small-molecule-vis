import Papa from 'papaparse';

class BondInformation {
    #metadata;

    constructor(metadata) {
        this.#metadata = metadata;
    }

    getElement1() {
        return this.#metadata.Element1;
    }

    getElement2() {
        return this.#metadata.Element2;
    }

    getBondType() {
        return this.#metadata.BondType;
    }

    getBondLength() {
        return this.#metadata.BondLength;
    }

    getBondEnergy() {
        return this.#metadata.BondEnergy;
    }
}

class BondTable {
    static #instance;
    static #loadingPromise;
    static #loadCalled = false;
    
    #singleBonds;
    #doubleBonds;
    #tripleBonds;

    constructor() {
        if (!BondTable.#loadCalled || BondTable.#instance) {
            throw new Error("Use BondTable.load() to get an instance.");
        }

        this.#singleBonds = {};
        this.#doubleBonds = {};
        this.#tripleBonds = {};
    }

    #resolveKey(bondDictionary, element1, element2) {
        const key1 = `${element1}${element2}`;
        const key2 = `${element2}${element1}`;
        if (bondDictionary.hasOwnProperty(key1)) {
            return key1;
        } else if (bondDictionary.hasOwnProperty(key2)) {
            return key2;
        } else {
            return "";
        }
    }

    #getBondDictionary(bondType) {
        switch (bondType) {
            case 'Single':
                return this.#singleBonds;
            case 'Double':
                return this.#doubleBonds;
            case 'Triple':
                return this.#tripleBonds;
            default:
                throw new Error(`${bondType} is an invalid bond type!`);
        }
    }

    getBondInformation(element1, element2, bondType) {
        const bondDictionary = this.#getBondDictionary(bondType);
        const key = this.#resolveKey(bondDictionary, element1, element2);
        return key ? bondDictionary[key] : null;
    }

    getBondTypes() {
        return ["Single", "Double", "Triple"];
    }

    static load() {
        if (!this.#instance) {
            this.#loadCalled = true;
            this.#instance = new this();
            this.#loadingPromise = new Promise((resolve, reject) => {
                fetch('/Bond_Table.csv')
                    .then(response => response.text())
                    .then(text => {
                        Papa.parse(text, {
                            header: true,
                            complete: results => {
                                results.data.forEach(rowData => {
                                    const bond = new BondInformation(rowData);
                                    const bondType = bond.getBondType();
                                    const bondHandle = `${bond.getElement1()}${bond.getElement2()}`;
                                    switch(bondType) {
                                        case 'Single':
                                            this.#instance.#singleBonds[bondHandle] = bond;
                                            break;
                                        case 'Double':
                                            this.#instance.#doubleBonds[bondHandle] = bond;
                                            break;
                                        case 'Triple':
                                            this.#instance.#tripleBonds[bondHandle] = bond;
                                            break;
                                        default:
                                            reject(`Failed to parse bond table... ${bondType} is not a vlid bond type!`);
                                            break;
                                    }
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

export default BondTable;
