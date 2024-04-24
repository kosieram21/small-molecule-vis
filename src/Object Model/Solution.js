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

    #euclideanDistance(pos1, pos2) {
        let sum = 0;
        for (let i = 0; i < pos1.length; i++) {
            const difference = pos1[i] - pos2[i];
            sum += difference * difference;
        }
        return Math.sqrt(sum);
    }

    #hookesLaw(k, x, c, v) {
        return [k * x[0] - c * v[0], k * x[1] - c * v[1], k * x[2] - c * v[2]];
    }

    #computeHookeForce(atom1, atom2, bond) {
        const bondLength = bond.getLength() / 200000;
        const bondEnergy = bond.getEnergy() / 200000;

        const [x1, y1, z1] = atom1.getPosition();
        const [x2, y2, z2] = atom2.getPosition();

        const [dx, dy, dz] = [x2 - x1, y2 - y1, z2 - z1]
        const magnitude = this.#euclideanDistance([dx, dy, dz], [0, 0, 0]);

        const [ex, ey, ez] = [dx / magnitude * bondLength, dy / magnitude * bondLength, dz / magnitude * bondLength];
        const [dex, dey, dez] = [dx - ex, dy - ey, dz - ez];

        const [fx, fy, fz] = this.#hookesLaw(bondEnergy, [dex, dey, dez], 0.01, atom1.getvelocity());
        return [fx, fy, fz];
    }

    simulationStep() {
        this.#atoms.forEach(atom1 => {
            atom1.setForce(0, 0, 0);

            atom1.getBonds().forEach(bond => {
                const atom2 = bond.getOtherAtom(atom1);
                const [hookeForceX, hookeForceY, hookeForceZ] = this.#computeHookeForce(atom1, atom2, bond);
                atom1.applyForce(hookeForceX, hookeForceY, hookeForceZ);
            });

            atom1.updateVelocity();
            atom1.updatePosition();
        });
    }
}

export default Solution;
