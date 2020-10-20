class ShapesApp {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.points = new Array();
    }

    initialize(options) {
        const { circleArea,
            lineWidth,
            strokeColors,
            fontFamily,
            minPoints,
            pointSize,
            resetButton,
            aboutButton,
            closeButton } = options;

        this.setSize();

        this.ctx.lineWidth = lineWidth;
        this.ctx.font = fontFamily;

        this.strokeColors = strokeColors;
        this.minPoints = minPoints;
        this.pointSize = pointSize;
        this.circleArea = circleArea;
        this.textSpace = 15;
        this.resetButton = document.getElementById(resetButton);
        this.aboutButton = document.getElementById(aboutButton);
        this.closeButton = document.getElementById(closeButton);
        this.bindEvents();
    }

    _proximity(x, y, point) {
        const xBigger = x > point.x - pointSize;
        const xSmaller = x < point.x + pointSize;
        const yBigger = y > point.y - pointSize;
        const ySmaller = y < point.y + pointSize;

        return xBigger && xSmaller && yBigger && ySmaller
    }

    bindEvents() {
        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this), false);
        this.canvas.addEventListener("mousemove", this.mouseMove.bind(this), false);
        this.canvas.addEventListener("mouseup", this.mouseUp.bind(this), false);
        this.resetButton.addEventListener("click", this.reset.bind(this), false);
        this.aboutButton.addEventListener("click", this.about.bind(this), false);
        this.closeButton.addEventListener("click", this.close.bind(this), false);
    }

    setSize() {
        const { innerWidth, innerHeight } = window;
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
    }

    addPoint(x, y) {
        this.points.push({
            x: x,
            y: y,
            dragged: false
        });
    }

    about(event) {
        const id = event.target.id;
        const content = document.getElementsByClassName(id)[0];
        content.style.display = "block";
    }

    reset() {
        this.points = [];
        this.clear();
    }

    close(event) {
        const content = document.getElementsByClassName("about")[0];
        content.style.display = "none";
    }

    clear() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
    }

    highlight(x, y) {
        const { ctx, pointSize, strokeColors, textSpace } = this;

        ctx.beginPath();
        ctx.strokeStyle = this.strokeColors.red;
        ctx.arc(x, y, pointSize, 0, this.circleArea, false);
        ctx.closePath();
        ctx.stroke();
        ctx.fillText(`x: ${x}`, x + textSpace, y);
        ctx.fillText(`y: ${y}`, x + textSpace, y + textSpace);
    }

    drawLines() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.strokeColors.blue;
        const area = Area.calculate(this.points);
        const centre = new Centre(this.points).calculate();

        this.points.map((point, index) => {
            let nextPoint = this.points[index + 1];
            const firstPoint = this.points[0];

            this.ctx.moveTo(point.x, point.y);

            if (nextPoint) {
                this.ctx.lineTo(nextPoint.x, nextPoint.y);
                this.ctx.stroke();
            } else {
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(firstPoint.x, firstPoint.y);
                this.ctx.stroke();
            };
        });

        this.ctx.closePath();
        this.ctx.fillText(`PA: ${area}`, centre.x, centre.y);
        this.drawCircle(centre, area);
    }

    drawCircle(position, area) {
        const { strokeColors, ctx, textSpace, circleArea } = this
        ctx.strokeStyle = strokeColors.yellow;
        ctx.globalCompositeOperation = 'destination-over';
        const { x, y } = position;
        const squareRoot = Math.sqrt(area / Math.PI);

        ctx.beginPath();
        ctx.arc(x, y, squareRoot, 0, circleArea, false);
        ctx.fillText(`CP x: ${x} y: ${y}`, x, y + (textSpace * 2));
        ctx.fillText(`CA: ${area}`, x, y + textSpace)
        ctx.stroke();
        ctx.closePath();
    }

    reDraw() {
        this.clear();
        let { minPoints } = this;
        const totalPoints = this.points.length;
        const hasMinPoints = totalPoints >= minPoints;

        if (hasMinPoints) {
            this.points = this.points.slice(0, 3);
            const equalMinPoints = this.points.length === minPoints;

            if (equalMinPoints) {
                const { x, y } = this.nextPoint(this.points);
                this.addPoint(x, y);
            }

            this.points.map((point, index) => {
                const { x, y } = point;

                this.addPoint(x, y);
                if (index < minPoints) {
                    this.highlight(x, y);
                }
            });

            this.drawLines();
        }
    }

    nextPoint(points) {
        const A = points[0],
              B = points[1],
              C = points[2];

        if (B.x === A.x || C.x === B.x) {
            this.points.push(this.points.shift());
            return this.nextPoint(this.points);
        }

        let AB = new Angle({ A: A, B: B }).calculate();
        let BC = new Angle({ A: B, B: C }).calculate();

        let CD = C.y - AB.alpha * C.x,
            DA = A.y - BC.alpha * A.x

        let { x, y } = Cordinates.calculate(
                            {
                                alpha: AB.alpha,
                                radius: CD
                            },

                            {
                                alpha: BC.alpha,
                                radius: DA
                            });

        return { x, y }

    }

    mouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const { clientX, clientY } = event;
        const { left, top } = rect;

        const x = (clientX - left) * (this.canvas.width / rect.width);
        const y = (clientY - top) * (this.canvas.height / rect.height);

        if (this.points.length >= this.minPoints) {
            this.points.map(point => {
                if (this._proximity(x, y, point)) {
                    point.dragged = true;
                    this.dragging = true;
                }
            });
        } else {
            const message = "Very close point, not added";
            let canAdd = true;

            this.points.map(point => {
                if(this._proximity(x, y, point)) {
                    console.error(message);
                    alert(message);
                    canAdd = false;
                }
            });

            if(canAdd) {
                this.addPoint(x, y);
                this.highlight(x, y);
            }
        }
        if (this.points.length === this.minPoints) {
            if (this.nextPoint(this.points)) {
                const { x, y } = this.nextPoint(this.points);

                this.addPoint(x, y);
                this.drawLines();
            }
        }

    }

    mouseMove(event) {
        const { movementX, movementY } = event;
        if (this.dragging) {
            this.points.map((point, index) => {
                let { x, y } = point;

                if (point.dragged) {
                    point.x = x += movementX;
                    point.y = y += movementY;
                }
            });

            this.reDraw();
        }

    }

    mouseUp() {
        if (this.dragging) {
            this.dragging = null;
            this.points.map((point, index) => {
                point.dragged = false;
            });

            this.reDraw();
        }
    }
}

class Vector {
    static vector(points) {
        const { A, B } = points;

        return {
            x: (B.x - A.x),
            y: (B.y - A.y)
        }
    }
}

class Area extends Vector {
    static calculate(points) {
        const A = points[0],
              B = points[1],
              C = points[2],
              AB = super.vector({A: A, B: B}),
              AC = super.vector({A: A, B: C});

        return Math.abs((AB.x * AC.y) - (AB.y * AC.x));
    }
}

class Angle {
    constructor(points) {
        this.points = points;
    }

    calculate() {
        let alpha = 0;
        let radius = 0;

        const { A, B } = this.points;

        const y = B.y - A.y;
        const x = B.x - A.x;

        if(B.x !== A.x) {
            alpha = y / x;
        }

        radius = B.y - (alpha * B.x);
        return { alpha, radius };
    }
}

class Cordinates {
    static calculate(point1, point2) {
        let x = 0;
        let y = 0;

        const a = point2.radius - point1.radius;
        const b = point1.alpha - point2.alpha;

        if(point1.alpha !== point2.alpha) {
            x = a / b;
        }

        y = point1.radius + (point1.alpha * x);
        return { x, y }
    }
}

class Centre {
    constructor(points) {
        this.points = points;
    }

    calculate() {
        const total = this.points.length;
        let x = 0,
            y = 0;

        for (let i = 0; i < total; i++) {
            x += this.points[i].x / total;
            y += this.points[i].y / total;
        }

        return { x: Math.round(x), y: Math.round(y) }
    }
}
