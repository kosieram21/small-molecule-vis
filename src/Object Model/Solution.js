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

    #coulombsLaw(k, x, q1, q2, r) {
        const force = (-k * q1 * q2) / (r * r);
        return [force * x[0], force * x[1], force * x[2]];
    }

    #computeHookeForce(atom1, atom2, bond) {
        const bondLength = bond.getLength() / 450;
        const bondEnergy = bond.getEnergy() / 2000000;

        const [x1, y1, z1] = atom1.getPosition();
        const [x2, y2, z2] = atom2.getPosition();

        const [dx, dy, dz] = [x2 - x1, y2 - y1, z2 - z1]
        const magnitude = this.#euclideanDistance([dx, dy, dz], [0, 0, 0]);

        const [ex, ey, ez] = [dx / magnitude * bondLength, dy / magnitude * bondLength, dz / magnitude * bondLength];
        const [dex, dey, dez] = [dx - ex, dy - ey, dz - ez];

        const [fx, fy, fz] = this.#hookesLaw(bondEnergy, [dex, dey, dez], 0.001, atom1.getvelocity());
        return [fx, fy, fz];
    }

    #computeCoulombForce(atom1, atom2) {
        const q1 = atom1.getAtomicRadius();
        const q2 = atom2.getAtomicRadius();

        const [x1, y1, z1] = atom1.getPosition();
        const [x2, y2, z2] = atom2.getPosition();

        const [dx, dy, dz] = [x2 - x1, y2 - y1, z2 - z1]
        const magnitude = this.#euclideanDistance([dx, dy, dz], [0, 0, 0]);

        const [ux, uy, uz] = [dx / magnitude, dy / magnitude, dz / magnitude];

        const [fx, fy, fz] = this.#coulombsLaw(0.00001, [ux, uy, uz], q1, q2, magnitude);
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

            this.#atoms.forEach(atom2 => {
                if (atom1 !== atom2) {
                    const [coulombForceX, coulombForceY, coulombForceZ] = this.#computeCoulombForce(atom1, atom2);
                    atom1.applyForce(coulombForceX, coulombForceY, coulombForceZ);
                }
            });

            if (!atom1.isAnchored()) {
                atom1.updateVelocity();
                atom1.updatePosition();
            }
        });
    }
}

export default Solution;
