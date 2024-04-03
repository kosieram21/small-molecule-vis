class Solution {
    #atoms;

    constructor() {
        this.#atoms = [];
    }

    getAtoms() {
        return this.#atoms;
    }

    addAtom(atom) {
        this.#atoms.push(atom);
    }
}

export default Solution;
