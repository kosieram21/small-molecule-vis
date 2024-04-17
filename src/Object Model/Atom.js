class Atom {
    #position;
    #symbol;
    #atomicNumber;
    #atomicRadius;
    #bonds;

    constructor(position, symbol, atomicNumber, atomicRadius) {
        this.#position = position;
        this.#symbol = symbol;
        this.#atomicNumber = atomicNumber;
        this.#atomicRadius = atomicRadius;
        this.#bonds = [];
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

    getAtomicRadius() {
        const minRadius = 0;
        const maxRadius = 3.3;
        const epsilon = 0.00001;
        return ((this.#atomicRadius - minRadius) / (maxRadius - minRadius)) + epsilon;
    }

    getColor() {
        const colorMap = ["red", "blue", "purple", ];
        return colorMap[this.#atomicNumber % colorMap.length];
    }

    getBonds() {
        return this.#bonds;
    }
}

export default Atom;
