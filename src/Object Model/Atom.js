class Atom {
    #position;
    #symbol;
    #atomicNumber;
    #atomicRadius

    constructor(position, symbol, atomicNumber, atomicRadius) {
        this.#position = position;
        this.#symbol = symbol;
        this.#atomicNumber = atomicNumber;
        this.#atomicRadius = atomicRadius;
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
        return (this.#atomicRadius - minRadius) / (maxRadius - minRadius);
    }

    getColor() {
        const colorMap = ["red", "blue", "purple", ];
        return colorMap[this.#atomicNumber % colorMap.length];
    }
}

export default Atom;
