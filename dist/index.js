"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Radar = /** @class */ (function () {
    function Radar(_a) {
        var _this = this;
        var ctx = _a.ctx, _b = _a.x, x = _b === void 0 ? 0 : _b, _d = _a.y, y = _d === void 0 ? 0 : _d, radius = _a.radius, shape = _a.shape, indicator = _a.indicator, splitNumber = _a.splitNumber, _e = _a.startAngle, startAngle = _e === void 0 ? 100 : _e, axisLine = _a.axisLine, splitLine = _a.splitLine, data = _a.data, name = _a.name;
        this._crossAxis = new Path2D();
        this._axis = new Path2D();
        this._polygon = new Path2D();
        this._splitPolygon = new Path2D();
        this._splitCircle = new Path2D();
        this._dataPoints = new Path2D();
        this._bezierDataPoints = new Path2D();
        this._mixinWhitelist = [Array];
        this._pointsDy = [];
        this.angle = 360;
        /**
         * 所有的坐标点
         */
        this.axisPointsAll = [];
        this.axisPoints = [];
        /**
         * 坐标轴
         */
        this.axisLine = {
            show: true,
            lineStyle: {
                color: "#000000",
                lineWidth: 1,
            },
        };
        /**
         * 分块
         */
        this.splitLine = {
            show: true,
            lineStyle: {
                color: "#000000",
                lineWidth: 1,
            },
        };
        this.name = {
            show: true,
            offsetX: 6,
            offsetY: 6,
            textStyle: {
                color: "#000000",
                fontStyle: "normal",
                fontSize: 18,
                fontWeight: "normal",
                fontFamily: "sans-serif",
                textAlign: "center",
                padding: 0,
            },
        };
        this.data = {
            show: true,
            value: [],
            offsetX: 0,
            offsetY: 0,
            bezierOffset: 0,
            symbol: {
                show: true,
                pointStyle: {
                    size: 4,
                    color: "#a9304b",
                },
            },
            type: "sharp",
            line: {
                show: true,
                lineStyle: {
                    color: "#000000",
                    lineWidth: 0,
                },
            },
        };
        this.dataPointsCoor = [];
        this.dataPointsMidCoor = [];
        this.dataAreaVectors = [];
        this._pointsLeftRightSineCosine = [];
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.cw = this.int(radius * 2);
        this.ch = this.int(radius * 2);
        this.cx = this.int(this.cw / 2) + this.x;
        this.cy = this.int(this.ch / 2) + this.y;
        this.shape = shape;
        this.indicator = indicator;
        this.r = radius;
        this.splitNumber = Array.from(new Array(splitNumber).keys()).map(function (i) { return i + 1; });
        this.startAngle = startAngle;
        this.axisLine = this.mixin(this.axisLine, axisLine);
        this.splitLine = this.mixin(this.splitLine, splitLine);
        this.name = this.mixin(this.name, name);
        this.data = this.mixin(this.data, data);
        this.dataRadius = this.indicator.map(function (item, i) {
            var val = _this.data.value[i];
            return _this.int((val / item.max) * _this.r);
        });
    }
    Radar.prototype.render = function () {
        this.points();
        if (this.axisLine.show) {
            this.axis();
            this.darwAxis();
        }
        if (this.splitLine.show) {
            this.pointsAll();
            this.splitPolygon();
            this.drawSplitPolygon();
        }
        if (this.name.show) {
            this.drawLabel();
        }
        if (this.data.show) {
            this.dataPoints();
            if (this.data.type === "smooth") {
                this.midCoorDataPoints();
                this.pointsSineCosine();
                this.bezierDataPoints();
            }
            this.darwDataPointsFill();
            if (this.data.line.show)
                this.darwDataPointsLine();
            if (this.data.symbol.show)
                this.darwDataPointsSymbolSize();
        }
    };
    /**
     * 计算所有的坐标点
     */
    Radar.prototype.pointsAll = function () {
        var _this = this;
        this.axisPointsAll = this.splitNumber.map(function (i) {
            var r = (_this.r * i) / _this.splitNumber.length;
            return _this.indicator.map(function (v, i) {
                var deg = _this.deg(i);
                return [_this.cosX(deg, r), _this.sinY(deg, r)];
            });
        });
    };
    /**
     * 计算最外围的坐标点
     */
    Radar.prototype.points = function () {
        var _this = this;
        this.axisPoints = this.indicator.map(function (v, i) {
            var deg = _this.deg(i);
            return [_this.cosX(deg, _this.r), _this.sinY(deg, _this.r)];
        });
    };
    /**
     * 创建 _Axis 路径对象
     */
    Radar.prototype.axis = function () {
        var _this = this;
        this.axisPoints.forEach(function (_a) {
            var x = _a[0], y = _a[1];
            _this._axis.moveTo(_this.cx, _this.cy);
            _this._axis.lineTo(x, y);
        });
    };
    /**
     * 绘制 Axis 坐标轴线
     * @param lineWidth 线宽
     * @param color 线的颜色
     */
    Radar.prototype.darwAxis = function (lineWidth, color) {
        if (lineWidth === void 0) { lineWidth = this.axisLine.lineStyle.lineWidth; }
        if (color === void 0) { color = this.axisLine.lineStyle.color; }
        var _l = this.ctx.lineWidth;
        var _s = this.ctx.strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.stroke(this._axis);
        this.ctx.lineWidth = _l;
        this.ctx.strokeStyle = _s;
    };
    /**
     * 创建 多边形分块线 路径对象
     */
    Radar.prototype.splitPolygon = function () {
        var _this = this;
        this.axisPointsAll.forEach(function (ps) {
            var _a = ps[0], x = _a[0], y = _a[1];
            _this._splitPolygon.moveTo(x, y);
            ps.forEach(function (_a, i) {
                var x = _a[0], y = _a[1];
                if (i !== 0) {
                    _this._splitPolygon.lineTo(x, y);
                }
            });
            _this._splitPolygon.closePath();
        });
    };
    /**
     * 绘制 多边形分块线
     */
    Radar.prototype.drawSplitPolygon = function (lineWidth, color) {
        if (lineWidth === void 0) { lineWidth = this.splitLine.lineStyle.lineWidth; }
        if (color === void 0) { color = this.splitLine.lineStyle.color; }
        var _l = this.ctx.lineWidth;
        var _s = this.ctx.strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.stroke(this._splitPolygon);
        this.ctx.lineWidth = _l;
        this.ctx.strokeStyle = _s;
    };
    /**
     * 创建 圆形分块线 路径对象
     */
    Radar.prototype.splitCricle = function () {
        var _this = this;
        this.splitNumber.forEach(function (i) {
            var r = (_this.r * i) / _this.splitNumber.length;
            _this._splitCircle.moveTo(_this.cosX(0, r), _this.sinY(0, r));
            _this._splitCircle.arc(_this.cx, _this.cy, r, 0, 2 * Math.PI, true);
        });
    };
    /**
     * 绘制 圆形分块线
     */
    Radar.prototype.drawSplitCricle = function (lineWidth, color) {
        if (lineWidth === void 0) { lineWidth = this.splitLine.lineStyle.lineWidth; }
        if (color === void 0) { color = this.splitLine.lineStyle.color; }
        var _l = this.ctx.lineWidth;
        var _s = this.ctx.strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.stroke(this._splitCircle);
        this.ctx.lineWidth = _l;
        this.ctx.strokeStyle = _s;
    };
    /**
     * 创建 _crossAxis 十字坐标 路径对象
     */
    Radar.prototype.crossAxis = function () {
        this._crossAxis.moveTo(this.x, this.cy);
        this._crossAxis.lineTo(this.cw + this.x, this.cy);
        this._crossAxis.moveTo(this.cx, this.y);
        this._crossAxis.lineTo(this.cx, this.ch + this.y);
    };
    /**
     * 绘制 CrossAxis 十字坐标线
     * @param lineWidth 线宽
     * @param color 线的颜色
     */
    Radar.prototype.drawCrossAxis = function (lineWidth, color) {
        if (lineWidth === void 0) { lineWidth = 0.2; }
        if (color === void 0) { color = "#000000"; }
        var _l = this.ctx.lineWidth;
        var _s = this.ctx.strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.stroke(this._crossAxis);
        this.ctx.lineWidth = _l;
        this.ctx.strokeStyle = _s;
    };
    /**
     * 创建绘制范围边框
     * @param lineWidth 线宽
     * @param color 线的颜色
     */
    Radar.prototype.drawArea = function (lineWidth, color) {
        if (lineWidth === void 0) { lineWidth = 0.2; }
        if (color === void 0) { color = "#000000"; }
        var _l = this.ctx.lineWidth;
        var _s = this.ctx.strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(this.x, this.y, this.cw, this.ch);
        this.ctx.lineWidth = _l;
        this.ctx.strokeStyle = _s;
    };
    /**
     * 绘制文字
     * @param text
     * @param x
     * @param y
     * @param fontSize
     * @param textAlign
     * @param color
     * @param fontWeight
     * @param fontFamily
     * @param backgroundColor
     * @param padding
     */
    Radar.prototype.fillText = function (text, x, y, fontSize, textAlign, color, fontWeight, fontFamily, backgroundColor, padding) {
        if (fontSize === void 0) { fontSize = this.name.textStyle.fontSize; }
        if (textAlign === void 0) { textAlign = this.name.textStyle.textAlign; }
        if (color === void 0) { color = this.name.textStyle.color; }
        if (fontWeight === void 0) { fontWeight = this.name.textStyle.fontWeight; }
        if (fontFamily === void 0) { fontFamily = this.name.textStyle.fontFamily; }
        if (backgroundColor === void 0) { backgroundColor = this.name.textStyle.backgroundColor; }
        if (padding === void 0) { padding = this.name.textStyle.padding; }
        var _f = this.ctx.font;
        var _c = this.ctx.fillStyle;
        this.ctx.font = fontWeight + " " + fontSize + "px " + fontFamily;
        var _a = this.ctx.measureText(text), width = _a.width, actualBoundingBoxAscent = _a.actualBoundingBoxAscent, actualBoundingBoxDescent = _a.actualBoundingBoxDescent;
        switch (textAlign) {
            case "center":
                x = x - width / 2;
                y = y + actualBoundingBoxAscent / 2;
                break;
        }
        if (backgroundColor) {
            var pad = padding * 2;
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(x - pad / 2, y - actualBoundingBoxAscent - pad / 2, width + pad, actualBoundingBoxAscent + actualBoundingBoxDescent + pad);
        }
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.font = _f;
        this.ctx.fillStyle = _c;
    };
    /**
     * 绘制标签
     */
    Radar.prototype.drawLabel = function () {
        var _this = this;
        this.axisPoints.forEach(function (_a, i) {
            var x = _a[0], y = _a[1];
            var targer = _this.indicator[i];
            var deg = _this.deg(i);
            var _f = _this.ctx.font;
            _this.ctx.font = _this.name.textStyle.fontWeight + " " + _this.name.textStyle.fontSize + "px " + _this.name.textStyle.fontFamily;
            var _b = _this.ctx.measureText(targer.text), width = _b.width, actualBoundingBoxAscent = _b.actualBoundingBoxAscent, actualBoundingBoxDescent = _b.actualBoundingBoxDescent;
            _this.ctx.font = _f;
            var d = (deg % 360) / 90;
            var quadrant = d > 0 ? Math.ceil(d) : 4 + Math.ceil(d);
            var rY = y - (_this.name.offsetY + actualBoundingBoxAscent / 2);
            var rX = x - (_this.name.offsetX + width / 2);
            var pY = y + (_this.name.offsetY + actualBoundingBoxAscent / 2);
            var pX = x + (_this.name.offsetX + width / 2);
            if (deg % 90 === 0) {
                switch (quadrant) {
                    case 1:
                        y = pY;
                        break;
                    case 2:
                        x = rX;
                        break;
                    case 3:
                        y = rY;
                        break;
                    case 4:
                        x = pX;
                        break;
                }
            }
            else {
                switch (quadrant) {
                    case 1:
                        y = pY;
                        x = pX;
                        break;
                    case 2:
                        y = pY;
                        x = rX;
                        break;
                    case 3:
                        y = rY;
                        x = rX;
                        break;
                    case 4:
                        y = rY;
                        x = pX;
                        break;
                }
            }
            _this.fillText(targer.text, x, y);
        });
    };
    /**
     * 创建 数据区域 路径对象
     */
    Radar.prototype.dataPoints = function () {
        var _this = this;
        this.dataPointsCoor = this.dataRadius.map(function (r, i) {
            var deg = _this.deg(i);
            return [
                _this.cosX(deg, r) + _this.data.offsetX,
                _this.sinY(deg, r) + _this.data.offsetY,
            ];
        });
        this.dataPointsCoor.forEach(function (_a, i) {
            var x = _a[0], y = _a[1];
            if (i === 0) {
                _this._dataPoints.moveTo(x, y);
            }
            else {
                _this._dataPoints.lineTo(x, y);
            }
        });
        this._dataPoints.closePath();
    };
    /**
     * 返回数据区域中点坐标list
     */
    Radar.prototype.midCoorDataPoints = function () {
        var _this = this;
        this.dataPointsMidCoor = this.dataPointsCoor.map(function (cur, i) {
            var nextIndex = i === _this.dataPointsCoor.length - 1 ? 0 : i + 1;
            var p1x = cur[0], p1y = cur[1];
            var _a = _this.dataPointsCoor[nextIndex], p2x = _a[0], p2y = _a[1];
            _this.dataAreaVectors.push(_this.vector(p1x, p1y, p2x, p2y));
            return __spreadArray([], _this.midCoor(p1x, p1y, p2x, p2y), true);
        });
    };
    /**
     * 数据区域点与点之间的cosine和sine值 用于计算bezierOffset的偏移点
     */
    Radar.prototype.pointsSineCosine = function () {
        var _this = this;
        this.dataPointsCoor.forEach(function (_a, lci) {
            var lp1x = _a[0], lp1y = _a[1];
            var lr = [];
            var lni = lci === _this.dataPointsCoor.length - 1 ? 0 : lci + 1;
            var _b = _this.dataPointsCoor[lni], lp2x = _b[0], lp2y = _b[1];
            lr.push(_this.sineCosine(lp1x, lp1y, lp2x, lp2y));
            var rpi = lci === 0 ? _this.dataPointsCoor.length - 1 : lci - 1;
            var _d = _this.dataPointsCoor[rpi], rp1x = _d[0], rp1y = _d[1];
            lr.push(_this.sineCosine(rp1x, rp1y, lp1x, lp1y).map(function (val) { return val * -1; }));
            _this._pointsLeftRightSineCosine.push(lr);
        });
    };
    /**
     * 给定两点坐标，返回以俩点的连线为斜边y为对边x为领边的直角三角形的cosine和sine值
     * @param p1x
     * @param p1y
     * @param p2x
     * @param p2y
     * @returns
     */
    Radar.prototype.sineCosine = function (p1x, p1y, p2x, p2y) {
        var x = p1x - p2x;
        var y = p1y - p2y;
        var hypo = this.int(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
        return [x / hypo, y / hypo];
    };
    /**
     * 传入一个控制点，返回以bezierOffset和cosine值sine值计算的偏移点
     * @param cpx
     * @param cpy
     * @param cos
     * @param sin
     * @returns
     */
    Radar.prototype.offset = function (cpx, cpy, cos, sin) {
        var x = cpx + this.data.bezierOffset * cos;
        var y = cpy + this.data.bezierOffset * sin;
        return [x, y];
    };
    /**
     * 绘制一个点
     * @param x
     * @param y
     * @param size
     * @param color
     */
    Radar.prototype.fillPoint = function (x, y, size, color) {
        var _f = this.ctx.fillStyle;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
        this.ctx.fillStyle = _f;
    };
    /**
     * 创建带贝塞尔控制点的 数据区域 路径对象
     */
    Radar.prototype.bezierDataPoints = function () {
        var _this = this;
        this.dataPointsMidCoor.forEach(function (_a, i) {
            var x = _a[0], y = _a[1];
            var nextIndex = i === _this.dataPointsCoor.length - 1 ? 0 : i + 1;
            var _b = _this.dataPointsMidCoor[nextIndex], nx = _b[0], ny = _b[1];
            var _d = _this.dataPointsCoor[nextIndex], cpx = _d[0], cpy = _d[1];
            var _e = _this._pointsLeftRightSineCosine[nextIndex], _g = _e[0], cos1 = _g[0], sin1 = _g[1], _h = _e[1], cos2 = _h[0], sin2 = _h[1];
            var _j = _this.offset(cpx, cpy, cos1, sin1), rx = _j[0], ry = _j[1];
            var _k = _this.offset(cpx, cpy, cos2, sin2), lx = _k[0], ly = _k[1];
            if (i === 0) {
                _this._bezierDataPoints.moveTo(x, y);
                _this._bezierDataPoints.bezierCurveTo(lx, ly, rx, ry, nx, ny);
            }
            else {
                _this._bezierDataPoints.bezierCurveTo(lx, ly, rx, ry, nx, ny);
            }
        });
    };
    /**
     * 绘制数据区域
     * @param fill
     */
    Radar.prototype.darwDataPointsFill = function (fill) {
        if (fill === void 0) { fill = this.data.fill; }
        if (fill) {
            if (Array.isArray(fill)) {
                var _a = this.polygonArea(this.dataPointsCoor), _b = _a[0], miniX = _b[0], miniY = _b[1], _d = _a[1], maxX = _d[0], maxY = _d[1];
                var lingrad_1 = this.ctx.createLinearGradient(0, maxY, 0, maxY - miniY);
                fill.forEach(function (_a) {
                    var offset = _a[0], color = _a[1];
                    lingrad_1.addColorStop(offset, color);
                });
                this.ctx.fillStyle = lingrad_1;
            }
            else {
                this.ctx.fillStyle = fill;
            }
            var _f = this.ctx.fillStyle;
            if (this.data.type === "sharp") {
                this.ctx.fill(this._dataPoints);
            }
            if (this.data.type === "smooth") {
                this.ctx.fill(this._bezierDataPoints);
            }
            this.ctx.fillStyle = _f;
        }
    };
    /**
     * 绘制数据区域边框
     * @param lineWidth
     * @param color
     */
    Radar.prototype.darwDataPointsLine = function (lineWidth, color) {
        if (lineWidth === void 0) { lineWidth = this.data.line.lineStyle.lineWidth; }
        if (color === void 0) { color = this.data.line.lineStyle.color; }
        var _l = this.ctx.lineWidth;
        var _s = this.ctx.strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        if (this.data.type === "sharp") {
            this.ctx.stroke(this._dataPoints);
        }
        if (this.data.type === "smooth") {
            this.ctx.stroke(this._bezierDataPoints);
        }
        this.ctx.lineWidth = _l;
        this.ctx.strokeStyle = _s;
    };
    /**
     * 绘制数据区域坐标点
     */
    Radar.prototype.darwDataPointsSymbolSize = function (size, color) {
        var _this = this;
        if (size === void 0) { size = this.data.symbol.pointStyle.size; }
        if (color === void 0) { color = this.data.symbol.pointStyle.color; }
        this.dataPointsCoor.forEach(function (_a, i) {
            var x = _a[0], y = _a[1];
            var _f = _this.ctx.fillStyle;
            _this.ctx.fillStyle = color;
            _this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
            _this.ctx.fillStyle = _f;
        });
    };
    Radar.prototype.vector = function (p1x, p1y, p2x, p2y) {
        var x = p2x - p1x;
        var y = p2y - p1y;
        if (x > 0 && y > 0)
            return 1;
        if (x > 0 && y < 0)
            return 2;
        if (x < 0 && y < 0)
            return 3;
        return 4;
    };
    Radar.prototype.quadrant = function (deg) {
        var d = (deg % 360) / 90;
        var quadrant = d > 0 ? Math.ceil(d) : 4 + Math.ceil(d);
        if (deg % 90 === 0) {
            switch (quadrant) {
                case 1:
                    return "a";
                case 2:
                    return "b";
                case 3:
                    return "c";
                case 4:
                    return "d";
            }
        }
        return quadrant;
    };
    /**
     * 返回一个四舍五入的数
     * @param num
     * @returns
     */
    Radar.prototype.int = function (num) {
        return Math.round(num);
    };
    /**
     * 根据角度和半径，返回 Y轴 坐标
     * @param deg 角度
     * @param r 半径
     * @returns
     */
    Radar.prototype.sinY = function (deg, r) {
        return this.int(this.sin(deg) * r + this.cy);
    };
    /**
     * 根据角度和半径，返回 X轴 坐标
     * @param deg 角度
     * @param r 半径
     * @returns
     */
    Radar.prototype.cosX = function (deg, r) {
        return this.int(this.cos(deg) * r + this.cx);
    };
    /**
     * 返回一个角度的Sine值
     * @param deg 角度
     * @returns
     */
    Radar.prototype.sin = function (deg) {
        return Math.sin((2 * deg * Math.PI) / 360);
    };
    /**
     * 返回一个角度的Cosine值
     * @param deg 角度
     * @returns
     */
    Radar.prototype.cos = function (deg) {
        return Math.cos((2 * deg * Math.PI) / 360);
    };
    /**
     * 返回以Y轴差值为对边，X轴差值为邻边的sine, cosine值
     * @param p1x
     * @param p1y
     * @param p2x
     * @param p2y
     * @returns num[0] - sine; num[1] -cosine
     */
    Radar.prototype.pSinCos = function (p1x, p1y, p2x, p2y) {
        var dx = p1x - p2x;
        var dy = p1y - p2y;
        var hypo = this.hypotenuse(p1x, p1y, p2x, p2y);
        this._pointsDy.push([dx, dy]);
        if (dx > 0 && dy > 0) {
            return [dy / hypo, dx / hypo];
        }
        else if (dx < 0 && dy < 0) {
            return [dy / hypo, dx / hypo];
        }
        else if (dx > 0 && dy < 0) {
            return [dx / hypo, dy / hypo];
        }
        else {
            return [dx / hypo, dy / hypo];
        }
    };
    /**
     * 返回经过两点互相垂直的直线，以两点的x、y差值为长度三角形的斜边长
     * @param p1x
     * @param p1y
     * @param p2x
     * @param p2y
     * @returns
     */
    Radar.prototype.hypotenuse = function (p1x, p1y, p2x, p2y) {
        var dx = Math.abs(p1x - p2x);
        var dy = Math.abs(p1y - p2y);
        return this.int(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)));
    };
    /**
     * 传入坐标轴索引返回减去偏移量的角度数
     * @param i 坐标轴索引，顺时针从0开始
     * @returns
     */
    Radar.prototype.deg = function (i) {
        return (this.angle * i) / this.indicator.length - this.startAngle;
    };
    /**
     * 传入坐标点数组，返回最小X轴坐标，最大X轴坐标。最小Y轴坐标，最大Y轴坐标
     * @param points
     */
    Radar.prototype.polygonArea = function (points) {
        var xs = points.map(function (_a) {
            var x = _a[0];
            return x;
        });
        var ys = points.map(function (_a) {
            var y = _a[1];
            return y;
        });
        return [
            [this.numMini(xs), this.numMini(ys)],
            [this.numMax(xs), this.numMax(ys)],
        ];
    };
    /**
     * 返回数字数组中的最大值
     * @param nums
     * @returns
     */
    Radar.prototype.numMax = function (nums) {
        var arr = nums.sort(function (a, b) { return a - b; });
        return arr[arr.length - 1];
    };
    /**
     * 返回数字数组中的最小值
     * @param nums
     * @returns
     */
    Radar.prototype.numMini = function (nums) {
        var arr = nums.sort(function (a, b) { return a - b; });
        return arr[0];
    };
    /**
     * 传入两个点，返回两点的中点
     * @param p1x
     * @param p1y
     * @param p2x
     * @param p2y
     */
    Radar.prototype.midCoor = function (p1x, p1y, p2x, p2y) {
        var dx = Math.abs((p1x - p2x) / 2);
        var dy = Math.abs((p1y - p2y) / 2);
        var x = p1x > p2x ? p2x + dx : p1x + dx;
        var y = p1y > p2y ? p2y + dy : p1y + dy;
        return [x, y];
    };
    /**
     * 将第二个参数对象混入到第一个对象并返回
     * @param obj
     * @param mixins
     * @returns
     */
    Radar.prototype.mixin = function (obj, mixins) {
        if (mixins) {
            var newObj = obj;
            var _loop_1 = function (prop) {
                if (mixins.hasOwnProperty(prop)) {
                    if (typeof mixins[prop] === "object" &&
                        !this_1._mixinWhitelist.some(function (proto) { return mixins[prop] instanceof proto; })) {
                        newObj[prop] = this_1.mixin(newObj[prop], mixins[prop]);
                    }
                    else {
                        newObj[prop] = mixins[prop];
                    }
                }
            };
            var this_1 = this;
            for (var prop in mixins) {
                _loop_1(prop);
            }
            return newObj;
        }
        else {
            return obj;
        }
    };
    return Radar;
}());
