class Atom {
    #position;
    #velocity;
    #force;
    #anchored;

    #symbol;
    #atomicNumber;
    #mass;
    #radius;
    #color;
    #bonds;

    constructor(position, symbol, atomicNumber, mass, radius, color) {
        this.#position = position;
        this.#velocity = [0, 0, 0];
        this.#force = [0, 0, 0];
        this.#anchored = false;

        this.#symbol = symbol;
        this.#atomicNumber = atomicNumber;
        this.#mass = mass;
        this.#radius = radius;
        this.#color = color;
        this.#bonds = new Map();
    }

    getPosition() {
        return this.#position;
    }

    setPosition(position) {
        this.#position = position;
    }

    setXPosition(xPosition) {
        this.#position[0] = xPosition;
    }

    setYPosition(yPosition) {
        this.#position[1] = yPosition;
    }

    setZPosition(zPosition) {
        this.#position[2] = zPosition;
    }

    getForce() {
        return this.#force;
    }

    setForce(fx, fy, fz) {
        this.#force[0] = fx;
        this.#force[1] = fy;
        this.#force[2] = fz;
    }

    applyForce(fx, fy, fz) {
        this.#force[0] += fx;
        this.#force[1] += fy;
        this.#force[2] += fz;
    }

    getvelocity() {
        return this.#velocity;
    }

    updateVelocity() {
        const scalar = 100;
        const accelerationX = this.#force[0] / this.#mass * scalar;
        const accelerationY = this.#force[1] / this.#mass * scalar;
        const accelerationZ = this.#force[2] / this.#mass * scalar;

        this.#velocity[0] += accelerationX;
        this.#velocity[1] += accelerationY;
        this.#velocity[2] += accelerationZ;
    }

    updatePosition() {
        this.#position[0] += this.#velocity[0];
        this.#position[1] += this.#velocity[1];
        this.#position[2] += this.#velocity[2];
    }

    isAnchored() {
        return this.#anchored;
    }

    setAnchor(anchored) {
        this.#anchored = anchored;
    }

    getSymbol() {
        return this.#symbol;
    }

    getAtomicNumber() {
        return this.#atomicNumber;
    }

    getRadius() {
        const minRadius = 0;
        const maxRadius = 3.3;
        const epsilon = 0.00001;
        return ((this.#radius - minRadius) / (maxRadius - minRadius)) + epsilon;
    }

    getMass() {
        return this.#mass;
    }

    getColor() {
        return this.#color;
    }

    getBonds() {
        return this.#bonds.values();
    }

    addBond(bond) {
        const otherAtom = bond.getOtherAtom(this);
        if (!this.#bonds.has(otherAtom)) {
            this.#bonds.set(otherAtom, bond);
        }
    }

    removeBond(bond) {
        const otherAtom = bond.getOtherAtom(this);
        if (this.#bonds.has(otherAtom)) {
            this.#bonds.delete(otherAtom);
        }
    }

    bondedWith(otherAtom) {
        return this.#bonds.has(otherAtom);
    }
}

export default Atom;
