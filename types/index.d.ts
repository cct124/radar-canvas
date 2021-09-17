declare type Shape = "polygon" | "circle";
declare type Matrix = [number, number, number, number, number, number];
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
    /**
     * 标签名
     */
    text: string;
    /**
     * 数据的最大值
     */
    max: number;
}
interface AxisLine {
    show: boolean;
    lineStyle: LineStyle;
}
interface Name {
    show: boolean;
    /**
     * 标签的x轴偏移值
     */
    offsetX: number;
    /**
     * 标签的y轴偏移值
     */
    offsetY: number;
    textStyle: TextStyle;
}
interface SplitLine {
    show: boolean;
    lineStyle: LineStyle;
}
interface Data {
    show: boolean;
    /**
     * 其中的value项数组是具体的数据，每个值跟 indicator 一一对应。
     */
    value: number[];
    /**
     * sharp 尖锐的交点 smooth 平滑的交点
     */
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
    /**
     * createLinearGradient 的 4 个参数
     */
    gradientXY?: number[];
    /**
     * 数据区域渲染的矩阵变换值
     */
    transform?: Matrix;
}
export default class Radar {
    _crossAxis: Path2D;
    _axis: Path2D;
    _polygon: Path2D;
    _splitPolygon: Path2D;
    _splitCircle: Path2D;
    _dataPoints: Path2D;
    _bezierDataPoints: Path2D;
    _mixinWhitelist: ArrayConstructor[];
    _pointsDy: number[][];
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
    angle: number;
    /**
     * 所有的坐标点
     */
    axisPointsAll: [number, number][][];
    axisPoints: [number, number][];
    /**
     * 坐标系起始角度，也就是第一个指示器轴的角度。
     */
    startAngle: number;
    /**
     * 坐标轴
     */
    axisLine: AxisLine;
    /**
     * 分块
     */
    splitLine: SplitLine;
    name: Name;
    data: Data;
    dataRadius: number[];
    dataPointsCoor: [number, number][];
    dataPointsMidCoor: number[][];
    dataAreaVectors: number[];
    _pointsLeftRightSineCosine: number[][][];
    transform: Matrix;
    constructor({ ctx, x, y, radius, shape, indicator, splitNumber, startAngle, axisLine, splitLine, data, name, transform, }: {
        /**
         * CanvasRenderingContext2D 对象
         */
        ctx: CanvasRenderingContext2D;
        /**
         * 在canvas上渲染的 X 坐标
         */
        x: number;
        /**
         * 在canvas上渲染的 Y 坐标
         */
        y: number;
        /**
         * radar图的半径
         */
        radius: number;
        /**
         * 指示器轴的分割线的类型
         */
        shape: Shape;
        /**
         * radar的指示器，用来指定雷达图中的多个变量（维度）
         */
        indicator: Indicator[];
        /**
         * 指示器轴的分割段数
         */
        splitNumber: number[];
        /**
         * 坐标系起始角度，也就是第一个指示器轴的角度。
         */
        startAngle: number;
        /**
         * 指示器轴线
         */
        axisLine: AxisLine;
        /**
         * 指示器轴的分割线
         */
        splitLine: SplitLine;
        /**
         * radar 的数据
         */
        data: Data;
        /**
         * radar 的标签
         */
        name: Name;
        /**
         * radar 图的变换值
         */
        transform: Matrix;
    });
    render(): void;
    renderBackground(): void;
    renderData(): void;
    /**
     * 计算所有的坐标点
     */
    pointsAll(): void;
    /**
     * 计算最外围的坐标点
     */
    points(): void;
    /**
     * 创建 _Axis 路径对象
     */
    axis(): void;
    /**
     * 绘制 Axis 坐标轴线
     * @param lineWidth 线宽
     * @param color 线的颜色
     */
    darwAxis(lineWidth?: number, color?: string): void;
    /**
     * 创建 多边形分块线 路径对象
     */
    splitPolygon(): void;
    /**
     * 绘制 多边形分块线
     */
    drawSplitPolygon(lineWidth?: number, color?: string): void;
    /**
     * 创建 圆形分块线 路径对象
     */
    splitCricle(): void;
    /**
     * 绘制 圆形分块线
     */
    drawSplitCricle(lineWidth?: number, color?: string): void;
    /**
     * 创建 _crossAxis 十字坐标 路径对象
     */
    crossAxis(): void;
    /**
     * 绘制 CrossAxis 十字坐标线
     * @param lineWidth 线宽
     * @param color 线的颜色
     */
    drawCrossAxis(lineWidth?: number, color?: string): void;
    /**
     * 创建绘制范围边框
     * @param lineWidth 线宽
     * @param color 线的颜色
     */
    drawArea(lineWidth?: number, color?: string): void;
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
    fillText(text: string, x: number, y: number, fontSize?: number, textAlign?: "normal" | "center", color?: string, fontWeight?: "normal" | "bold" | "bolder" | "lighter", fontFamily?: string, backgroundColor?: string | undefined, padding?: number): void;
    /**
     * 绘制标签
     */
    drawLabel(): void;
    /**
     * 创建 数据区域 路径对象
     */
    dataPoints(): void;
    /**
     * 返回数据区域中点坐标list
     */
    midCoorDataPoints(): void;
    /**
     * 数据区域点与点之间的cosine和sine值 用于计算bezierOffset的偏移点
     */
    pointsSineCosine(): void;
    /**
     * 给定两点坐标，返回以俩点的连线为斜边y为对边x为领边的直角三角形的cosine和sine值
     * @param p1x
     * @param p1y
     * @param p2x
     * @param p2y
     * @returns
     */
    sineCosine(p1x: number, p1y: number, p2x: number, p2y: number): number[];
    /**
     * 传入一个控制点，返回以bezierOffset和cosine值sine值计算的偏移点
     * @param cpx
     * @param cpy
     * @param cos
     * @param sin
     * @returns
     */
    offset(cpx: number, cpy: number, cos: number, sin: number): number[];
    /**
     * 绘制一个点
     * @param x
     * @param y
     * @param size
     * @param color
     */
    fillPoint(x: number, y: number, size: number, color: string): void;
    /**
     * 创建带贝塞尔控制点的 数据区域 路径对象
     */
    bezierDataPoints(): void;
    /**
     * 绘制数据区域
     * @param fill
     */
    darwDataPointsFill(fill?: string | [number, string][] | undefined): void;
    /**
     * 绘制数据区域边框
     * @param lineWidth
     * @param color
     */
    darwDataPointsLine(lineWidth?: number, color?: string): void;
    /**
     * 绘制数据区域坐标点
     */
    darwDataPointsSymbolSize(size?: number, color?: string): void;
    vector(p1x: number, p1y: number, p2x: number, p2y: number): 1 | 4 | 2 | 3;
    quadrant(deg: number): number | "a" | "b" | "c" | "d";
    /**
     * 返回一个四舍五入的数
     * @param num
     * @returns
     */
    int(num: number): number;
    /**
     * 根据角度和半径，返回 Y轴 坐标
     * @param deg 角度
     * @param r 半径
     * @returns
     */
    sinY(deg: number, r: number): number;
    /**
     * 根据角度和半径，返回 X轴 坐标
     * @param deg 角度
     * @param r 半径
     * @returns
     */
    cosX(deg: number, r: number): number;
    /**
     * 返回一个角度的Sine值
     * @param deg 角度
     * @returns
     */
    sin(deg: number): number;
    /**
     * 返回一个角度的Cosine值
     * @param deg 角度
     * @returns
     */
    cos(deg: number): number;
    /**
     * 返回以Y轴差值为对边，X轴差值为邻边的sine, cosine值
     * @param p1x
     * @param p1y
     * @param p2x
     * @param p2y
     * @returns num[0] - sine; num[1] -cosine
     */
    pSinCos(p1x: number, p1y: number, p2x: number, p2y: number): number[];
    /**
     * 返回经过两点互相垂直的直线，以两点的x、y差值为长度三角形的斜边长
     * @param p1x
     * @param p1y
     * @param p2x
     * @param p2y
     * @returns
     */
    hypotenuse(p1x: number, p1y: number, p2x: number, p2y: number): number;
    /**
     * 传入坐标轴索引返回减去偏移量的角度数
     * @param i 坐标轴索引，顺时针从0开始
     * @returns
     */
    deg(i: number): number;
    /**
     * 传入坐标点数组，返回最小X轴坐标，最大X轴坐标。最小Y轴坐标，最大Y轴坐标
     * @param points
     */
    polygonArea(points: [number, number][]): number[][];
    /**
     * 返回数字数组中的最大值
     * @param nums
     * @returns
     */
    numMax(nums: number[]): number;
    /**
     * 返回数字数组中的最小值
     * @param nums
     * @returns
     */
    numMini(nums: number[]): number;
    /**
     * 传入两个点，返回两点的中点
     * @param p1x
     * @param p1y
     * @param p2x
     * @param p2y
     */
    midCoor(p1x: number, p1y: number, p2x: number, p2y: number): number[];
    /**
     * 将第二个参数对象混入到第一个对象并返回
     * @param obj
     * @param mixins
     * @returns
     */
    mixin<T>(obj: any, mixins: any): T;
}
export {};
