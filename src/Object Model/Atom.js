class Atom {
    #position;
    #symbol;
    #atomicNumber;

    constructor(position, symbol, atomicNumber) {
        this.#position = position;
        this.#symbol = symbol;
        this.#atomicNumber = atomicNumber;
    }

    getPosition() {
        return this.#position;
    }

    getSymbol() {
        return this.#symbol;
    }

    getAtomicNumber() {
        return this.#atomicNumber;
    }

    getColor() {
        const colorMap = [ "red", "green", "blue", ];
        return colorMap[this.#atomicNumber % 3];
    }
}

export default Atom;
