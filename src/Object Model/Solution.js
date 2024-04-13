class Solution {
    #atoms;
    #bonds;

    constructor() {
        this.#atoms = [];
        this.#bonds = [];
    }

    getAtoms() {
        return this.#atoms;
    }

    addAtom(atom) {
        this.#atoms.push(atom);
    }

    getBonds() {
        return this.#bonds;
    }

    addBond(bond) {
        this.#bonds.push(bond);
    }
}

export default Solution;
