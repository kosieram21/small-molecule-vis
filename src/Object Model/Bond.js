class Bond {
    #atom1;
    #atom2;
    #length;
    #type;

    constructor(atom1, atom2, length, type) {
        this.#atom1 = atom1;
        this.#atom2 = atom2;
        this.#length = length;
        this.#type = type;
    }

    getAtom1() {
        return this.#atom1;
    }

    getAtom2() {
        return this.#atom2;
    }

    getLength() {
        return this.#length;
    }

    getType() {
        return this.#type;
    }
}

export default Bond;