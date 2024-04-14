class Solution {
    #atoms;
    #bonds;

    constructor() {
        this.#atoms = [];
        this.#bonds = [];
    }

    addAtom(atom) {
        this.#atoms.push(atom);
    }

    addBond(bond) {
        this.#bonds.push(bond);
    }

    getAtoms() {
        return this.#atoms;
    }

    getBonds() {
        return this.#bonds;
    }
}

export default Solution;
