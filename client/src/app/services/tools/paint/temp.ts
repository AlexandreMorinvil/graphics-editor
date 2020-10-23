/*
    hexToRgb(hex: string): void {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result != null) {
            this.fillColorR = parseInt(result[1], 16);
            this.fillColorG = parseInt(result[2], 16);
            this.fillColorB = parseInt(result[3], 16);
            this.fillColorA = this.colorService.getPrimaryColorOpacity() * 255;
        }
    }

    // http://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
    // tslint:disable:cyclomatic-complexity
    floodfillAlgorithm(): void {
        const pixelStack = [[this.pathData[0].x, this.pathData[0].y]];

        while (pixelStack.length) {
            let newPos;
            let x;
            let y;
            let pixelPos;
            let reachLeft;
            let reachRight;

            newPos = pixelStack.pop();
            x = newPos![0];
            y = newPos![1];

            pixelPos = (y * this.drawingService.baseCtx.canvas.width + x) * INCREMENTAL_VALUE_WIDTH;
            while (y-- >= 0 && this.matchStartColor(pixelPos)) {
                pixelPos -= this.drawingService.baseCtx.canvas.width * INCREMENTAL_VALUE_WIDTH;
            }
            pixelPos += this.drawingService.baseCtx.canvas.width * INCREMENTAL_VALUE_WIDTH;
            ++y;
            reachLeft = false;
            reachRight = false;
            while (y++ < this.drawingService.baseCtx.canvas.height - 1 && this.matchStartColor(pixelPos)) {
                this.colorPixel(pixelPos);

                if (x > 0) {
                    if (this.matchStartColor(pixelPos - INCREMENTAL_VALUE_WIDTH)) {
                        if (!reachLeft) {
                            pixelStack.push([x - 1, y]);
                            reachLeft = true;
                        }
                    } else if (reachLeft) {
                        reachLeft = false;
                    }
                }

                if (x < this.drawingService.baseCtx.canvas.width - 1) {
                    if (this.matchStartColor(pixelPos + INCREMENTAL_VALUE_WIDTH)) {
                        if (!reachRight) {
                            pixelStack.push([x + 1, y]);
                            reachRight = true;
                        }
                    } else if (reachRight) {
                        reachRight = false;
                    }
                }

                pixelPos += this.drawingService.baseCtx.canvas.width * INCREMENTAL_VALUE_WIDTH;
            }
        }
        this.drawingService.baseCtx.putImageData(this.imageData, 0, 0);
    }
    matchStartColor(pixelPos: number): boolean {
        this.imageData = this.drawingService.baseCtx.getImageData(
            0,
            0,
            this.drawingService.baseCtx.canvas.width,
            this.drawingService.baseCtx.canvas.height,
        );
        const r = this.imageData.data[pixelPos];
        const g = this.imageData.data[pixelPos + 1];
        const b = this.imageData.data[pixelPos + 2];

        return r === this.startR && g === this.startG && b === this.startB;
    }

    colorPixel(pixelPos: number): void {
        this.imageData.data[pixelPos] = this.fillColorR;
        this.imageData.data[pixelPos + 1] = this.fillColorG;
        this.imageData.data[pixelPos + 2] = this.fillColorB;
        // tslint:disable:no-magic-numbers
        this.imageData.data[pixelPos + 3] = this.fillColorA;
    }

    getStartColor(): number {
        this.startR = this.drawingService.baseCtx.getImageData(this.pathData[0].x, this.pathData[0].y, 1, 1).data[0];
        this.startG = this.drawingService.baseCtx.getImageData(this.pathData[0].x, this.pathData[0].y, 1, 1).data[1];
        this.startB = this.drawingService.baseCtx.getImageData(this.pathData[0].x, this.pathData[0].y, 1, 1).data[2];

        this.startA = this.drawingService.baseCtx.getImageData(this.pathData[0].x, this.pathData[0].y, 1, 1).data[3];
        return this.startR && this.startG && this.startB && this.startA;
    } */

/* floodfill(tolerance: number): boolean {
        let img: ImageData = this.drawingService.baseCtx.getImageData(
            0,
            0,
            this.drawingService.baseCtx.canvas.width,
            this.drawingService.baseCtx.canvas.height,
        );
        let data = img.data;
        let length = data.length;
        let stack = [];
        let i = (this.pathData[0].x + this.pathData[0].y * this.drawingService.baseCtx.canvas.width) * 4;
        let me,
            mw,
            w2 = this.drawingService.baseCtx.canvas.width * 4;
        let targetcolor = [data[i], data[i + 1], data[i + 2], data[i + 3]];

        if (!this.pixelCompare(i, targetcolor, tolerance)) {
            return false;
        }
        stack.push(i);
        while (stack.length) {
            let i: number = stack.pop()!;
            if (this.pixelCompareAndSet(i, targetcolor, tolerance)) {
                let e = i!;
                let w = i!;
                mw = (i / w2) * w2; //left bound
                me = mw + w2; //right bound
                while (mw < (w -= 4) && this.pixelCompareAndSet(w, targetcolor, tolerance)) {
                    console.log('inside while !!!');
                } //go left until edge hit
                while (me > (e += 4) && this.pixelCompareAndSet(e, targetcolor, tolerance)); //go right until edge hit
                for (var j = w; j < e; j += 4) {
                    if (j - w2 >= 0 && this.pixelCompare(j - w2, targetcolor, tolerance)) stack.push(j - w2); //queue y-1
                    if (j + w2 < length && this.pixelCompare(j + w2, targetcolor, tolerance)) stack.push(j + w2); //queue y+1
                }
            }
        }
        this.drawingService.baseCtx.putImageData(img, 0, 0);
        return true;
    }

    pixelCompare(i: number, targetcolor: number[], tolerance: number) {
        let img: ImageData = this.drawingService.baseCtx.getImageData(
            0,
            0,
            this.drawingService.baseCtx.canvas.width,
            this.drawingService.baseCtx.canvas.height,
        );

        if (i < 0 || i >= img.data.length) return false; //out of bounds
        if (img.data[i + 3] === 0) return true; //surface is invisible

        if (
            targetcolor[3] === this.fillColorA &&
            targetcolor[0] === this.fillColorR &&
            targetcolor[1] === this.fillColorG &&
            targetcolor[2] === this.fillColorB
        )
            return false; //target is same as fill

        if (
            targetcolor[3] === img.data[i + 3] &&
            targetcolor[0] === img.data[i] &&
            targetcolor[1] === img.data[i + 1] &&
            targetcolor[2] === img.data[i + 2]
        )
            return true; //target matches surface

        if (
            Math.abs(targetcolor[3] - img.data[i + 3]) <= 255 - tolerance &&
            Math.abs(targetcolor[0] - img.data[i]) <= tolerance &&
            Math.abs(targetcolor[1] - img.data[i + 1]) <= tolerance &&
            Math.abs(targetcolor[2] - img.data[i + 2]) <= tolerance
        )
            return true; //target to surface within tolerance

        return false; //no match
    }

    pixelCompareAndSet(i: number, targetcolor: number[], tolerance: number) {
        if (this.pixelCompare(i, targetcolor, tolerance)) {
            let img: ImageData = this.drawingService.baseCtx.getImageData(
                0,
                0,
                this.drawingService.baseCtx.canvas.width,
                this.drawingService.baseCtx.canvas.height,
            );
            //fill the color
            img.data[i] = this.fillColorR;
            img.data[i + 1] = this.fillColorG;
            img.data[i + 2] = this.fillColorB;
            img.data[i + 3] = this.fillColorA;
            return true;
        }
        return false;
    }
  colorDifference(firstColor: string, secondColor: string) {
        if (!firstColor && !secondColor) return;

        const _firstColor = firstColor.charAt(0) == '#' ? firstColor.substring(1, 7) : firstColor;
        const _secondColor = secondColor.charAt(0) == '#' ? secondColor.substring(1, 7) : secondColor;

        const _r = parseInt(_firstColor.substring(0, 2), 16);
        const _g = parseInt(_firstColor.substring(2, 4), 16);
        const _b = parseInt(_firstColor.substring(4, 6), 16);

        const __r = parseInt(_secondColor.substring(0, 2), 16);
        const __g = parseInt(_secondColor.substring(2, 4), 16);
        const __b = parseInt(_secondColor.substring(4, 6), 16);

        let r1 = (_r / 255) * 100;
        let g1 = (_g / 255) * 100;
        let b1 = (_b / 255) * 100;

        let perc1 = Math.round((r1 + g1 + b1) / 3);

        let r2 = (__r / 255) * 100;
        let g2 = (__g / 255) * 100;
        let b2 = (__b / 255) * 100;

        let perc2 = Math.round((r2 + g2 + b2) / 3);
        return Math.abs(perc1 - perc2);
    }
    getPixelColorHex(pixelPos: Vec2): void {
        //get the pixel on the first Path of mouse
        const imageData: ImageData = this.drawingService.baseCtx.getImageData(pixelPos.x, pixelPos.y, 1, 1);
        let r = imageData.data[0];
        let g = imageData.data[1];
        let b = imageData.data[2];

        let rHex = r.toString(16);
        let gHex = g.toString(16);
        let bHex = b.toString(16);

        if (rHex.length == 1) rHex = '0' + rHex;
        if (gHex.length == 1) gHex = '0' + gHex;
        if (bHex.length == 1) bHex = '0' + bHex;

        this.pixelRGBHex = '#' + rHex + gHex + bHex;
    }

    setFillColor() {
        let hexColor = this.colorService.getPrimaryColor();
        // console.log(this.colorService.getPrimaryColor());

        // 4 digits
        if (hexColor.length == 5) {
            this.fillColorR = parseInt('0x' + hexColor[1] + hexColor[1]);
            this.fillColorG = parseInt('0x' + hexColor[2] + hexColor[2]);
            this.fillColorB = parseInt('0x' + hexColor[3] + hexColor[3]);
            this.fillColorA = this.colorService.getPrimaryColorOpacity();
            //console.log(this.fillColorR + ' ' + this.fillColorG + ' ' + this.fillColorB + ' ' + (this.fillColorA * 255).toFixed(0));
            // 9 digits
        } else {
            this.fillColorR = parseInt('0x' + hexColor[1] + hexColor[2]);
            this.fillColorG = parseInt('0x' + hexColor[3] + hexColor[4]);
            this.fillColorB = parseInt('0x' + hexColor[5] + hexColor[6]);
            this.fillColorA = this.colorService.getPrimaryColorOpacity();

            //console.log(this.fillColorR + ' ' + this.fillColorG + ' ' + this.fillColorB + ' ' + (this.fillColorA * 255).toFixed(0));
        }
        isInCanvas(mousePosition: Vec2): boolean {
        return mousePosition.x <= this.drawingService.baseCtx.canvas.width && mousePosition.y <= this.drawingService.baseCtx.canvas.height;
    }
    } */
