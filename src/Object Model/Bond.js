class Bond {
    #atom1;
    #atom2;
    #length;
    #energy;
    #type;

    constructor(atom1, atom2, length, energy, type) {
        this.#atom1 = atom1;
        this.#atom2 = atom2;
        this.#length = length;
        this.#energy = energy;
        this.#type = type;
    }

    getAtom1() {
        return this.#atom1;
    }

    getAtom2() {
        return this.#atom2;
    }

    getOtherAtom(atom) {
        return this.#atom1 === atom ? this.#atom2 : this.#atom1;
    }

    getLength() {
        return this.#length;
    }

    getEnergy() {
        return this.#energy;
    }

    getType() {
        return this.#type;
    }

    update(bondInfo) {
        if (bondInfo) {
            this.#length = bondInfo.getBondLength();
            this.#energy = bondInfo.getBondEnergy();
            this.#type = bondInfo.getBondType();
        }
    }
}

export default Bond;
