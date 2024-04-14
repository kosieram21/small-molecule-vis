class Solution {
    #atoms;
    #bonds;

    constructor() {
        this.#atoms = new Set();
        this.#bonds = new Set();
    }

    addAtom(atom) {
        this.#atoms.add(atom);
    }

    addBond(bond) {
        this.#bonds.add(bond);
    }

    removeAtom(atom) {
        if (this.#atoms.has(atom)) {
            this.#atoms.delete(atom);
            atom.getBonds().forEach(bond => this.removeBond(bond));
        }
    }

    removeBond(bond) {
        if (this.#bonds.has(bond)) {
            this.#bonds.delete(bond);
        }
    }

    getAtoms() {
        return this.#atoms;
    }

    getBonds() {
        return this.#bonds;
    }
}

export default Solution;
