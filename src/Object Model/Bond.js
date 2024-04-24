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

        this.#atom1.getBonds().push(this);
        this.#atom2.getBonds().push(this);
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

    update(bondInfo) {
        if (bondInfo) {
            this.#length = bondInfo.getBondLength();
            this.#type = bondInfo.getBondType();
        }
    }
}

export default Bond;
