class Atom {
    #position;
    #velocity;
    #force;
    #anchored;

    #symbol;
    #atomicNumber;
    #atomicMass;
    #atomicRadius;
    #color;
    #bonds;

    constructor(position, symbol, atomicNumber, atomicMass, atomicRadius, color) {
        this.#position = position;
        this.#velocity = [0, 0, 0];
        this.#force = [0, 0, 0];
        this.#anchored = false;

        this.#symbol = symbol;
        this.#atomicNumber = atomicNumber;
        this.#atomicMass = atomicMass;
        this.#atomicRadius = atomicRadius;
        this.#color = color;
        this.#bonds = new Set();
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
        const accelerationX = this.#force[0] / this.#atomicMass * scalar;
        const accelerationY = this.#force[1] / this.#atomicMass * scalar;
        const accelerationZ = this.#force[2] / this.#atomicMass * scalar;

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

    getAtomicRadius() {
        const minRadius = 0;
        const maxRadius = 3.3;
        const epsilon = 0.00001;
        return ((this.#atomicRadius - minRadius) / (maxRadius - minRadius)) + epsilon;
    }

    getMass() {
        return this.#atomicMass;
    }

    getColor() {
        return this.#color;
    }

    getBonds() {
        return this.#bonds;
    }
}

export default Atom;
