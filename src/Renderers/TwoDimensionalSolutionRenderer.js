import Two from 'two.js';

class TwoDimensionalSolutionRenderer {
    #two;

    domElement;

    constructor() {
        this.#two = new Two();
        this.#two.scene.translation.set(this.#two.width / 2, this.#two.height / 2);
        this.domElement = this.#two.renderer.domElement;
    }

    dispose() {
        this.#two.clear();
    }

    getWidth() {
        return this.#two.width;
    }

    getHeight() {
        return this.#two.height;
    }

    setSize(width, height) {
        const prevWidth = this.#two.width || 1;
        const prevHeight = this.#two.height || 1;

        const scaleWidth = width / prevWidth;
        const scaleHeight = height / prevHeight;

        this.#two.scene.translation.set(
            this.#two.scene.translation.x * scaleWidth,
            this.#two.scene.translation.y * scaleHeight
        );

        this.#two.width = width;
        this.#two.height = height;
    }

    getScale() {
        return this.#two.scene.scale;
    }

    setScale(scale) {
        this.#two.scene.scale = scale;
    }

    getTranslation() {
        return this.#two.scene.translation;
    }

    setTranslation(translation) {
        this.#two.scene.translation = translation;
    }

    getCanvasCoordinates(solutionX, solutionY) {
        const canvasX = solutionX * this.#two.width;
        const canvasY = solutionY * this.#two.height;
        return new Two.Vector(canvasX, canvasY);
    }

    getCanvasRadius(atomicRadius) {
        const canvasRadius = 20 + 50 * atomicRadius;
        return atomicRadius === 0 ? 0 : canvasRadius;
    }

    #getCanvasFontSize(atomicRadius) {
        const fontSize = 30 + 60 * atomicRadius;
        return fontSize;
    }

    #getAtomColor(atom, colorEnabled) {
        if (colorEnabled) {
            if (atom.getSymbol() === 'C' || atom.getSymbol() === '..') {
                return 'black';
            } else if (atom.getSymbol() === 'H') {
                return 'gray';
            } else {
                return atom.getColor();
            }
        }
        return 'black';
    }

    getCanvasLineWidth() {
        return 4;
    }

    #getHighlightColor(isAnchored) {
        return isAnchored ? 'rgba(255, 173, 173, 0.5)' : 'rgba(173, 216, 230, 0.5)'
    }

    #renderGrid(gridEnabled) {
        if (gridEnabled) {
            const spacingX = this.#two.width / 10;
            const spacingY = this.#two.height / 10;
            const color = 'blue';
            const lineWidth = 1;
            const dash = [2, 4];

            const minX = (-this.#two.scene.translation.x) / this.#two.scene.scale;
            const maxX = (this.#two.width - this.#two.scene.translation.x) / this.#two.scene.scale;
            const minY = (-this.#two.scene.translation.y) / this.#two.scene.scale;
            const maxY = (this.#two.height - this.#two.scene.translation.y) / this.#two.scene.scale;

            const startX = Math.floor(minX / spacingX) * spacingX;
            const endX = Math.ceil(maxX / spacingX) * spacingX;
            const startY = Math.floor(minY / spacingY) * spacingY;
            const endY = Math.ceil(maxY / spacingY) * spacingY;

            for (let x = startX; x <= endX; x += spacingX) {
                const line = new Two.Line(x, minY, x, maxY);
                line.stroke = color;
                line.linewidth = lineWidth;
                line.dashes = dash;
                this.#two.add(line);
            }

            for (let y = startY; y <= endY; y += spacingY) {
                const line = new Two.Line(minX, y, maxX, y);
                line.stroke = color;
                line.linewidth = lineWidth;
                line.dashes = dash;
                this.#two.add(line);
            }
        }
    }

    #renderSingleBond(startX, startY, endX, endY, radius1, radius2) {
        const canvasStart = this.getCanvasCoordinates(startX, startY);
        const canvasEnd = this.getCanvasCoordinates(endX, endY);

        const canvasRadius1 = this.getCanvasRadius(radius1);
        const canvasRadius2 = this.getCanvasRadius(radius2);
        const canvasLineWidth = this.getCanvasLineWidth();

        const direction = Two.Vector.sub(canvasStart, canvasEnd).normalize();

        const a = Two.Vector.sub(canvasStart, direction.clone().multiplyScalar(canvasRadius1));
        const b = Two.Vector.add(canvasEnd, direction.clone().multiplyScalar(canvasRadius2));

        const line = new Two.Line(a.x, a.y, b.x, b.y);
        line.stroke = 'black';
        line.linewidth = canvasLineWidth;
        this.#two.add(line);
    }

    #renderDoubleBond(startX, startY, endX, endY, radius1, radius2) {
        const canvasStart = this.getCanvasCoordinates(startX, startY);
        const canvasEnd = this.getCanvasCoordinates(endX, endY);

        const canvasRadius1 = this.getCanvasRadius(radius1);
        const canvasRadius2 = this.getCanvasRadius(radius2);
        const canvasLineWidth = this.getCanvasLineWidth();

        const direction = Two.Vector.sub(canvasStart, canvasEnd).normalize();
        const offset= new Two.Vector(-direction.y, direction.x).multiplyScalar(canvasLineWidth * 2);

        const a = Two.Vector.sub(canvasStart, direction.clone().multiplyScalar(canvasRadius1));
        const b = Two.Vector.add(canvasEnd, direction.clone().multiplyScalar(canvasRadius2));

        const a1 = Two.Vector.add(a, offset);
        const b1 = Two.Vector.add(b, offset);

        const a2 = Two.Vector.sub(a, offset);
        const b2 = Two.Vector.sub(b, offset);

        const line1 = new Two.Line(a1.x, a1.y, b1.x, b1.y);
        line1.stroke = 'black';
        line1.linewidth = canvasLineWidth;
        this.#two.add(line1);
        
        const line2 = new Two.Line(a2.x, a2.y, b2.x, b2.y);
        line2.stroke = 'black';
        line2.linewidth = canvasLineWidth;
        this.#two.add(line2);
    }

    #renderTripleBond(startX, startY, endX, endY, radius1, radius2) {
        const canvasStart = this.getCanvasCoordinates(startX, startY);
        const canvasEnd = this.getCanvasCoordinates(endX, endY);

        const canvasRadius1 = this.getCanvasRadius(radius1);
        const canvasRadius2 = this.getCanvasRadius(radius2);
        const canvasLineWidth = this.getCanvasLineWidth();

        const direction = Two.Vector.sub(canvasStart, canvasEnd).normalize();
        const offset= new Two.Vector(-direction.y, direction.x).multiplyScalar(canvasLineWidth * 2);

        const a = Two.Vector.sub(canvasStart, direction.clone().multiplyScalar(canvasRadius1));
        const b = Two.Vector.add(canvasEnd, direction.clone().multiplyScalar(canvasRadius2));

        const a1 = Two.Vector.add(a, offset);
        const b1 = Two.Vector.add(b, offset);

        const a2 = Two.Vector.sub(a, offset);
        const b2 = Two.Vector.sub(b, offset);

        const line1 = new Two.Line(a.x, a.y, b.x, b.y);
        line1.stroke = 'black';
        line1.linewidth = canvasLineWidth;
        this.#two.add(line1);

        const line2 = new Two.Line(a1.x, a1.y, b1.x, b1.y);
        line2.stroke = 'black';
        line2.linewidth = canvasLineWidth;
        this.#two.add(line2);
        
        const line3 = new Two.Line(a2.x, a2.y, b2.x, b2.y);
        line3.stroke = 'black';
        line3.linewidth = canvasLineWidth;
        this.#two.add(line3);
    }

    #renderBondByType(bondType, startX, startY, endX, endY, radius1, radius2) {
        switch(bondType) {
            case 'Single':
                this.#renderSingleBond(startX, startY, endX, endY, radius1, radius2);
                break;
            case 'Double':
                this.#renderDoubleBond(startX, startY, endX, endY, radius1, radius2);
                break;
            case 'Triple':
                this.#renderTripleBond(startX, startY, endX, endY, radius1, radius2);
                break;
            default:
                break;
        }
    }

    #renderCurrentBond(currentX, currentY, selectedAtom, hoveredAtom, bondType) {
        if (currentX && currentY && selectedAtom && selectedAtom !== hoveredAtom && bondType) {
            const clientCoords = new Two.Vector(currentX, currentY);
            const [startX, startY] = selectedAtom.getPosition();
            const [endX, endY] = hoveredAtom ? hoveredAtom.getPosition() : [clientCoords.x, clientCoords.y];
            const radius1 = selectedAtom.getRadius();
            const radius2 = hoveredAtom ? hoveredAtom.getRadius() : 0;
            this.#renderBondByType(bondType, startX, startY, endX, endY, radius1, radius2);
        }
    }

    #renderBond(bond) {
        const bondType = bond.getType();
        const [startX, startY] = bond.getAtom1().getPosition();
        const [endX, endY] = bond.getAtom2().getPosition();
        const radius1 = bond.getAtom1().getRadius();
        const radius2 = bond.getAtom2().getRadius();
        this.#renderBondByType(bondType, startX, startY, endX, endY, radius1, radius2);
    }

    #renderAtom(atom, colorEnabled) {
        const [x, y] = atom.getPosition();
        const symbol = atom.getSymbol();
        const atomicRadius = atom.getRadius();

        const canvasCoords = this.getCanvasCoordinates(x, y);

        const text = new Two.Text(symbol, canvasCoords.x, canvasCoords.y);
        text.fill = this.#getAtomColor(atom, colorEnabled);
        text.alignment = 'center';
        text.baseline = 'middle';
        text.size = this.#getCanvasFontSize(atomicRadius);
        this.#two.add(text);
    }

    #renderBondHighlights(bond, selectedAtom, hoveredAtom, selectedBond, hoveredBond) {
        if (!selectedAtom && !hoveredAtom && (bond === selectedBond || bond === hoveredBond)) {
            const [startX, startY] = bond.getAtom1().getPosition();
            const [endX, endY] = bond.getAtom2().getPosition();

            const canvasStart = this.getCanvasCoordinates(startX, startY);
            const canvasEnd = this.getCanvasCoordinates(endX, endY);
            const canvasMid = Two.Vector.add(canvasStart, canvasEnd).divideScalar(2);
            const distance = canvasStart.distanceTo(canvasEnd);

            const rx = (distance / 2) - 17;
            const ry = this.getCanvasLineWidth() * 7;

            const highlight = new Two.Ellipse(canvasMid.x, canvasMid.y, rx, ry);
            highlight.fill = this.#getHighlightColor();
            highlight.rotation = Two.Vector.angleBetween(canvasStart, canvasEnd);
            highlight.noStroke();
            this.#two.add(highlight);
        }
    }

    #renderAtomHighlights(atom, selectedAtom, hoveredAtom) {
        if (atom === selectedAtom || atom === hoveredAtom || atom.isAnchored()) {
            const [x, y] = atom.getPosition();
            const atomicRadius = atom.getRadius();

            const canvasCoords = this.getCanvasCoordinates(x, y);
            const canvasRadius = this.getCanvasRadius(atomicRadius);

            const highlight = new Two.Circle(canvasCoords.x, canvasCoords.y, canvasRadius);
            highlight.fill = this.#getHighlightColor(atom.isAnchored());
            highlight.noStroke();
            this.#two.add(highlight);
        }
    }

    #renderMolecules(solution, colorEnabled) {
        solution.getBonds().forEach(bond => this.#renderBond(bond));
        solution.getAtoms().forEach(atom => this.#renderAtom(atom, colorEnabled));
    }

    #renderHighlights(solution, selectedAtom, hoveredAtom, selectedBond, hoveredBond) {
        solution.getBonds().forEach(bond => this.#renderBondHighlights(bond, selectedAtom, hoveredAtom, selectedBond, hoveredBond));
        solution.getAtoms().forEach(atom => this.#renderAtomHighlights(atom, selectedAtom, hoveredAtom));
    }

    renderSolution(solution,
        selectedAtom = null, hoveredAtom = null,
        selectedBond = null, hoveredBond = null,
        currentX = null, currentY = null, bondType = null,
        colorEnabled = true, gridEnabled = false
    ) {
        this.#two.clear();  
        this.#renderGrid(gridEnabled);
        this.#renderCurrentBond(currentX, currentY, selectedAtom, hoveredAtom, bondType);
        this.#renderMolecules(solution, colorEnabled);
        this.#renderHighlights(solution, selectedAtom, hoveredAtom, selectedBond, hoveredBond);
        this.#two.update();
    }
}

export default TwoDimensionalSolutionRenderer;