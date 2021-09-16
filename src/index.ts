type Shape = "polygon" | "circle";

interface TextStyle {
  /**
   * 字体大小
   */
  fontSize: number;
  /**
   * 颜色
   */
  color: string;
  /**
   * 字体的粗细程度
   */
  fontWeight: "normal" | "bold" | "bolder" | "lighter";
  fontStyle: "normal" | "italic" | "oblique";
  fontFamily: string;
  backgroundColor?: string;
  textAlign: "normal" | "center";
  padding: number;
}

interface LineStyle {
  lineWidth: number;
  color: string;
}

interface pointStyle {
  size: number;
  color: string;
}

interface Indicator {
  text: string;
  max: number;
  textStyle?: TextStyle;
}

interface AxisLine {
  show: boolean;
  lineStyle: LineStyle;
}

interface Name {
  show: boolean;
  offsetX: number;
  offsetY: number;
  textStyle: TextStyle;
}

interface SplitLine {
  show: boolean;
  lineStyle: LineStyle;
}

interface Data {
  show: boolean;
  value: number[];
  type: "sharp" | "smooth";
  /**
   * 数据区域的边线
   */
  line: {
    show: boolean;
    lineStyle: LineStyle;
  };
  /**
   * 数据区域的交点
   */
  symbol: {
    show: boolean;
    pointStyle: pointStyle;
  };
  /**
   * 控制bezier控制点的偏移，控制这个值可以控制圆角，只有在 type 为smooth时生效
   */
  bezierOffset: number;
  /**
   * X 轴偏移值
   */
  offsetX: number;
  /**
   * Y 轴偏移值
   */
  offsetY: number;
  /**
   * 填充的色值，当为数组时为渐变色
   */
  fill?: string | [number, string][];
}

class Radar {
  _crossAxis = new Path2D();
  _axis = new Path2D();
  _polygon = new Path2D();
  _splitPolygon = new Path2D();
  _splitCircle = new Path2D();
  _dataPoints = new Path2D();
  _bezierDataPoints = new Path2D();
  _mixinWhitelist = [Array];
  _pointsDy: number[][] = [];

  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  cw: number;
  ch: number;
  cx: number;
  cy: number;
  r: number;
  splitNumber: number[];
  shape: Shape;
  indicator: Indicator[];
  angle = 360;
  /**
   * 所有的坐标点
   */
  axisPointsAll: [number, number][][] = [];

  axisPoints: [number, number][] = [];
  /**
   * 坐标系起始角度，也就是第一个指示器轴的角度。
   */
  startAngle: number;

  /**
   * 坐标轴
   */
  axisLine: AxisLine = {
    show: true,
    lineStyle: {
      color: "#000000",
      lineWidth: 1,
    },
  };

  /**
   * 分块
   */
  splitLine: SplitLine = {
    show: true,
    lineStyle: {
      color: "#000000",
      lineWidth: 1,
    },
  };

  name: Name = {
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

  data: Data = {
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

  dataRadius: number[];
  dataPointsCoor: [number, number][] = [];

  dataPointsMidCoor: number[][] = [];

  dataAreaVectors: number[] = [];

  _pointsLeftRightSineCosine: number[][][] = [];
  constructor({
    ctx,
    x = 0,
    y = 0,
    radius,
    shape,
    indicator,
    splitNumber,
    startAngle = 100,
    axisLine,
    splitLine,
    data,
    name,
  }: {
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number;
    radius: number;
    shape: Shape;
    indicator: Indicator[];
    splitNumber: number[];
    startAngle: number;
    axisLine: AxisLine;
    splitLine: SplitLine;
    data: Data;
    name: Name;
  }) {
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
    this.splitNumber = Array.from(new Array(splitNumber).keys()).map(
      (i) => i + 1
    );
    this.startAngle = startAngle;

    this.axisLine = this.mixin(this.axisLine, axisLine);
    this.splitLine = this.mixin(this.splitLine, splitLine);
    this.name = this.mixin(this.name, name);
    this.data = this.mixin(this.data, data);

    this.dataRadius = this.indicator.map((item, i) => {
      const val = this.data.value[i];
      return this.int((val / item.max) * this.r);
    });
  }

  render() {
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
      if (this.data.line.show) this.darwDataPointsLine();
      if (this.data.symbol.show) this.darwDataPointsSymbolSize();
    }
  }

  /**
   * 计算所有的坐标点
   */
  pointsAll() {
    this.axisPointsAll = this.splitNumber.map((i) => {
      const r = (this.r * i) / this.splitNumber.length;
      return this.indicator.map((v, i) => {
        const deg = this.deg(i);
        return [this.cosX(deg, r), this.sinY(deg, r)];
      });
    });
  }

  /**
   * 计算最外围的坐标点
   */
  points() {
    this.axisPoints = this.indicator.map((v, i) => {
      const deg = this.deg(i);
      return [this.cosX(deg, this.r), this.sinY(deg, this.r)];
    });
  }

  /**
   * 创建 _Axis 路径对象
   */
  axis() {
    this.axisPoints.forEach(([x, y]) => {
      this._axis.moveTo(this.cx, this.cy);
      this._axis.lineTo(x, y);
    });
  }

  /**
   * 绘制 Axis 坐标轴线
   * @param lineWidth 线宽
   * @param color 线的颜色
   */
  darwAxis(
    lineWidth = this.axisLine.lineStyle.lineWidth,
    color = this.axisLine.lineStyle.color
  ) {
    const _l = this.ctx.lineWidth;
    const _s = this.ctx.strokeStyle;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.stroke(this._axis);
    this.ctx.lineWidth = _l;
    this.ctx.strokeStyle = _s;
  }

  /**
   * 创建 多边形分块线 路径对象
   */
  splitPolygon() {
    this.axisPointsAll.forEach((ps) => {
      const [x, y] = ps[0];
      this._splitPolygon.moveTo(x, y);

      ps.forEach(([x, y], i) => {
        if (i !== 0) {
          this._splitPolygon.lineTo(x, y);
        }
      });

      this._splitPolygon.closePath();
    });
  }

  /**
   * 绘制 多边形分块线
   */
  drawSplitPolygon(
    lineWidth = this.splitLine.lineStyle.lineWidth,
    color = this.splitLine.lineStyle.color
  ) {
    const _l = this.ctx.lineWidth;
    const _s = this.ctx.strokeStyle;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.stroke(this._splitPolygon);
    this.ctx.lineWidth = _l;
    this.ctx.strokeStyle = _s;
  }

  /**
   * 创建 圆形分块线 路径对象
   */
  splitCricle() {
    this.splitNumber.forEach((i) => {
      const r = (this.r * i) / this.splitNumber.length;
      this._splitCircle.moveTo(this.cosX(0, r), this.sinY(0, r));
      this._splitCircle.arc(this.cx, this.cy, r, 0, 2 * Math.PI, true);
    });
  }

  /**
   * 绘制 圆形分块线
   */
  drawSplitCricle(
    lineWidth = this.splitLine.lineStyle.lineWidth,
    color = this.splitLine.lineStyle.color
  ) {
    const _l = this.ctx.lineWidth;
    const _s = this.ctx.strokeStyle;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.stroke(this._splitCircle);
    this.ctx.lineWidth = _l;
    this.ctx.strokeStyle = _s;
  }

  /**
   * 创建 _crossAxis 十字坐标 路径对象
   */
  crossAxis() {
    this._crossAxis.moveTo(this.x, this.cy);
    this._crossAxis.lineTo(this.cw + this.x, this.cy);
    this._crossAxis.moveTo(this.cx, this.y);
    this._crossAxis.lineTo(this.cx, this.ch + this.y);
  }

  /**
   * 绘制 CrossAxis 十字坐标线
   * @param lineWidth 线宽
   * @param color 线的颜色
   */
  drawCrossAxis(lineWidth = 0.2, color = "#000000") {
    const _l = this.ctx.lineWidth;
    const _s = this.ctx.strokeStyle;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.stroke(this._crossAxis);
    this.ctx.lineWidth = _l;
    this.ctx.strokeStyle = _s;
  }

  /**
   * 创建绘制范围边框
   * @param lineWidth 线宽
   * @param color 线的颜色
   */
  drawArea(lineWidth = 0.2, color = "#000000") {
    const _l = this.ctx.lineWidth;
    const _s = this.ctx.strokeStyle;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.strokeRect(this.x, this.y, this.cw, this.ch);
    this.ctx.lineWidth = _l;
    this.ctx.strokeStyle = _s;
  }

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
  fillText(
    text: string,
    x: number,
    y: number,
    fontSize = this.name.textStyle.fontSize,
    textAlign = this.name.textStyle.textAlign,
    color = this.name.textStyle.color,
    fontWeight = this.name.textStyle.fontWeight,
    fontFamily = this.name.textStyle.fontFamily,
    backgroundColor = this.name.textStyle.backgroundColor,
    padding = this.name.textStyle.padding
  ) {
    const _f = this.ctx.font;
    const _c = this.ctx.fillStyle;

    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
      this.ctx.measureText(text);

    switch (textAlign) {
      case "center":
        x = x - width / 2;
        y = y + actualBoundingBoxAscent / 2;
        break;
    }

    if (backgroundColor) {
      const pad = padding * 2;
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(
        x - pad / 2,
        y - actualBoundingBoxAscent - pad / 2,
        width + pad,
        actualBoundingBoxAscent + actualBoundingBoxDescent + pad
      );
    }

    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);

    this.ctx.font = _f;
    this.ctx.fillStyle = _c;
  }

  /**
   * 绘制标签
   */
  drawLabel() {
    this.axisPoints.forEach(([x, y], i) => {
      const targer = this.indicator[i];
      const deg = this.deg(i);

      const _f = this.ctx.font;
      this.ctx.font = `${this.name.textStyle.fontWeight} ${this.name.textStyle.fontSize}px ${this.name.textStyle.fontFamily}`;
      const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
        this.ctx.measureText(targer.text);
      this.ctx.font = _f;

      const d = (deg % 360) / 90;
      const quadrant = d > 0 ? Math.ceil(d) : 4 + Math.ceil(d);

      const rY = y - (this.name.offsetY + actualBoundingBoxAscent / 2);
      const rX = x - (this.name.offsetX + width / 2);

      const pY = y + (this.name.offsetY + actualBoundingBoxAscent / 2);
      const pX = x + (this.name.offsetX + width / 2);

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
      } else {
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

      this.fillText(targer.text, x, y);
    });
  }

  /**
   * 创建 数据区域 路径对象
   */
  dataPoints() {
    this.dataPointsCoor = this.dataRadius.map((r, i) => {
      const deg = this.deg(i);
      return [
        this.cosX(deg, r) + this.data.offsetX,
        this.sinY(deg, r) + this.data.offsetY,
      ];
    });

    this.dataPointsCoor.forEach(([x, y], i) => {
      if (i === 0) {
        this._dataPoints.moveTo(x, y);
      } else {
        this._dataPoints.lineTo(x, y);
      }
    });
    this._dataPoints.closePath();
  }

  /**
   * 返回数据区域中点坐标list
   */
  midCoorDataPoints() {
    this.dataPointsMidCoor = this.dataPointsCoor.map((cur, i) => {
      const nextIndex = i === this.dataPointsCoor.length - 1 ? 0 : i + 1;
      const [p1x, p1y] = cur;
      const [p2x, p2y] = this.dataPointsCoor[nextIndex];
      this.dataAreaVectors.push(this.vector(p1x, p1y, p2x, p2y));

      return [...this.midCoor(p1x, p1y, p2x, p2y)];
    });
  }

  /**
   * 数据区域点与点之间的cosine和sine值 用于计算bezierOffset的偏移点
   */
  pointsSineCosine() {
    this.dataPointsCoor.forEach(([lp1x, lp1y], lci) => {
      const lr = [];
      const lni = lci === this.dataPointsCoor.length - 1 ? 0 : lci + 1;
      const [lp2x, lp2y] = this.dataPointsCoor[lni];

      lr.push(this.sineCosine(lp1x, lp1y, lp2x, lp2y));

      const rpi = lci === 0 ? this.dataPointsCoor.length - 1 : lci - 1;
      const [rp1x, rp1y] = this.dataPointsCoor[rpi];

      lr.push(this.sineCosine(rp1x, rp1y, lp1x, lp1y).map((val) => val * -1));

      this._pointsLeftRightSineCosine.push(lr);
    });
  }

  /**
   * 给定两点坐标，返回以俩点的连线为斜边y为对边x为领边的直角三角形的cosine和sine值
   * @param p1x
   * @param p1y
   * @param p2x
   * @param p2y
   * @returns
   */
  sineCosine(p1x: number, p1y: number, p2x: number, p2y: number) {
    const x = p1x - p2x;
    const y = p1y - p2y;
    const hypo = this.int(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));

    return [x / hypo, y / hypo];
  }

  /**
   * 传入一个控制点，返回以bezierOffset和cosine值sine值计算的偏移点
   * @param cpx
   * @param cpy
   * @param cos
   * @param sin
   * @returns
   */
  offset(cpx: number, cpy: number, cos: number, sin: number) {
    const x = cpx + this.data.bezierOffset * cos;
    const y = cpy + this.data.bezierOffset * sin;

    return [x, y];
  }

  /**
   * 绘制一个点
   * @param x
   * @param y
   * @param size
   * @param color
   */
  fillPoint(x: number, y: number, size: number, color: string) {
    const _f = this.ctx.fillStyle;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
    this.ctx.fillStyle = _f;
  }

  /**
   * 创建带贝塞尔控制点的 数据区域 路径对象
   */
  bezierDataPoints() {
    this.dataPointsMidCoor.forEach(([x, y], i) => {
      const nextIndex = i === this.dataPointsCoor.length - 1 ? 0 : i + 1;
      const [nx, ny] = this.dataPointsMidCoor[nextIndex];
      const [cpx, cpy] = this.dataPointsCoor[nextIndex];

      const [[cos1, sin1], [cos2, sin2]] =
        this._pointsLeftRightSineCosine[nextIndex];

      const [rx, ry] = this.offset(cpx, cpy, cos1, sin1);
      const [lx, ly] = this.offset(cpx, cpy, cos2, sin2);

      if (i === 0) {
        this._bezierDataPoints.moveTo(x, y);
        this._bezierDataPoints.bezierCurveTo(lx, ly, rx, ry, nx, ny);
      } else {
        this._bezierDataPoints.bezierCurveTo(lx, ly, rx, ry, nx, ny);
      }
    });
  }

  /**
   * 绘制数据区域
   * @param fill
   */
  darwDataPointsFill(fill = this.data.fill) {
    if (fill) {
      if (Array.isArray(fill)) {
        const [[miniX, miniY], [maxX, maxY]] = this.polygonArea(
          this.dataPointsCoor
        );

        const lingrad = this.ctx.createLinearGradient(0, maxY, 0, maxY - miniY);

        fill.forEach(([offset, color]) => {
          lingrad.addColorStop(offset, color);
        });

        this.ctx.fillStyle = lingrad;
      } else {
        this.ctx.fillStyle = fill;
      }
      const _f = this.ctx.fillStyle;

      if (this.data.type === "sharp") {
        this.ctx.fill(this._dataPoints);
      }
      if (this.data.type === "smooth") {
        this.ctx.fill(this._bezierDataPoints);
      }

      this.ctx.fillStyle = _f;
    }
  }

  /**
   * 绘制数据区域边框
   * @param lineWidth
   * @param color
   */
  darwDataPointsLine(
    lineWidth = this.data.line.lineStyle.lineWidth,
    color = this.data.line.lineStyle.color
  ) {
    const _l = this.ctx.lineWidth;
    const _s = this.ctx.strokeStyle;
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
  }

  /**
   * 绘制数据区域坐标点
   */
  darwDataPointsSymbolSize(
    size = this.data.symbol.pointStyle.size,
    color = this.data.symbol.pointStyle.color
  ) {
    this.dataPointsCoor.forEach(([x, y], i) => {
      const _f = this.ctx.fillStyle;

      this.ctx.fillStyle = color;
      this.ctx.fillRect(x - size / 2, y - size / 2, size, size);

      this.ctx.fillStyle = _f;
    });
  }

  vector(p1x: number, p1y: number, p2x: number, p2y: number) {
    const x = p2x - p1x;
    const y = p2y - p1y;
    if (x > 0 && y > 0) return 1;
    if (x > 0 && y < 0) return 2;
    if (x < 0 && y < 0) return 3;
    return 4;
  }

  quadrant(deg: number) {
    const d = (deg % 360) / 90;
    const quadrant = d > 0 ? Math.ceil(d) : 4 + Math.ceil(d);

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
  }

  /**
   * 返回一个四舍五入的数
   * @param num
   * @returns
   */
  int(num: number) {
    return Math.round(num);
  }

  /**
   * 根据角度和半径，返回 Y轴 坐标
   * @param deg 角度
   * @param r 半径
   * @returns
   */
  sinY(deg: number, r: number) {
    return this.int(this.sin(deg) * r + this.cy);
  }

  /**
   * 根据角度和半径，返回 X轴 坐标
   * @param deg 角度
   * @param r 半径
   * @returns
   */
  cosX(deg: number, r: number) {
    return this.int(this.cos(deg) * r + this.cx);
  }

  /**
   * 返回一个角度的Sine值
   * @param deg 角度
   * @returns
   */
  sin(deg: number) {
    return Math.sin((2 * deg * Math.PI) / 360);
  }

  /**
   * 返回一个角度的Cosine值
   * @param deg 角度
   * @returns
   */
  cos(deg: number) {
    return Math.cos((2 * deg * Math.PI) / 360);
  }

  /**
   * 返回以Y轴差值为对边，X轴差值为邻边的sine, cosine值
   * @param p1x
   * @param p1y
   * @param p2x
   * @param p2y
   * @returns num[0] - sine; num[1] -cosine
   */
  pSinCos(p1x: number, p1y: number, p2x: number, p2y: number) {
    const dx = p1x - p2x;
    const dy = p1y - p2y;
    const hypo = this.hypotenuse(p1x, p1y, p2x, p2y);

    this._pointsDy.push([dx, dy]);

    if (dx > 0 && dy > 0) {
      return [dy / hypo, dx / hypo];
    } else if (dx < 0 && dy < 0) {
      return [dy / hypo, dx / hypo];
    } else if (dx > 0 && dy < 0) {
      return [dx / hypo, dy / hypo];
    } else {
      return [dx / hypo, dy / hypo];
    }
  }

  /**
   * 返回经过两点互相垂直的直线，以两点的x、y差值为长度三角形的斜边长
   * @param p1x
   * @param p1y
   * @param p2x
   * @param p2y
   * @returns
   */
  hypotenuse(p1x: number, p1y: number, p2x: number, p2y: number) {
    const dx = Math.abs(p1x - p2x);
    const dy = Math.abs(p1y - p2y);
    return this.int(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)));
  }

  /**
   * 传入坐标轴索引返回减去偏移量的角度数
   * @param i 坐标轴索引，顺时针从0开始
   * @returns
   */
  deg(i: number) {
    return (this.angle * i) / this.indicator.length - this.startAngle;
  }

  /**
   * 传入坐标点数组，返回最小X轴坐标，最大X轴坐标。最小Y轴坐标，最大Y轴坐标
   * @param points
   */
  polygonArea(points: [number, number][]) {
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    return [
      [this.numMini(xs), this.numMini(ys)],
      [this.numMax(xs), this.numMax(ys)],
    ];
  }

  /**
   * 返回数字数组中的最大值
   * @param nums
   * @returns
   */
  numMax(nums: number[]) {
    const arr = nums.sort((a, b) => a - b);
    return arr[arr.length - 1];
  }

  /**
   * 返回数字数组中的最小值
   * @param nums
   * @returns
   */
  numMini(nums: number[]) {
    const arr = nums.sort((a, b) => a - b);
    return arr[0];
  }

  /**
   * 传入两个点，返回两点的中点
   * @param p1x
   * @param p1y
   * @param p2x
   * @param p2y
   */
  midCoor(p1x: number, p1y: number, p2x: number, p2y: number) {
    const dx = Math.abs((p1x - p2x) / 2);
    const dy = Math.abs((p1y - p2y) / 2);
    const x = p1x > p2x ? p2x + dx : p1x + dx;
    const y = p1y > p2y ? p2y + dy : p1y + dy;
    return [x, y];
  }

  /**
   * 将第二个参数对象混入到第一个对象并返回
   * @param obj
   * @param mixins
   * @returns
   */
  mixin<T>(obj: any, mixins: any) {
    if (mixins) {
      const newObj = obj;

      for (let prop in mixins) {
        if (mixins.hasOwnProperty(prop)) {
          if (
            typeof mixins[prop] === "object" &&
            !this._mixinWhitelist.some((proto) => mixins[prop] instanceof proto)
          ) {
            newObj[prop] = this.mixin(newObj[prop], mixins[prop]);
          } else {
            newObj[prop] = mixins[prop];
          }
        }
      }

      return newObj as T;
    } else {
      return obj as T;
    }
  }
}
