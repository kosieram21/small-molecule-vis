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
        const atom1 = bond.getAtom1();
        const atom2 = bond.getAtom2();
        atom1.addBond(bond);
        atom2.addBond(bond);
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
            const atom1 = bond.getAtom1();
            const atom2 = bond.getAtom2();
            atom1.removeBond(bond);
            atom2.removeBond(bond);
            this.#bonds.delete(bond);
        }
    }

    clear() {
        this.#atoms.clear();
        this.#bonds.clear();
    }

    getAtoms() {
        return this.#atoms;
    }

    getBonds() {
        return this.#bonds;
    }
}

export default Solution;
