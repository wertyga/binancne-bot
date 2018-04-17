'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.exponentialMovingAverage = exponentialMovingAverage;
exports.macdCalculate = macdCalculate;
exports.signalMACD = signalMACD;
exports.simpleMA = simpleMA;
// EMA [today] = (Price [today] x K) + (EMA [yesterday] x (1 – K))
function exponentialMovingAverage(dataObjArray, timePeriod) {
    // dataObj = {
    //  time: Date,
    //   price: Number
    // }
    if (dataObjArray.length < timePeriod) {
        console.error('Data array must be more or equeal then time period!');
        return;
    };

    var K = 2 / (timePeriod + 1);

    var newDataArr = dataObjArray.slice(0, timePeriod);
    var avg = 0;
    newDataArr.forEach(function (item) {
        avg += +item.price;
    });
    var firstEma = avg / timePeriod;
    dataObjArray[timePeriod - 1]['ema-' + timePeriod] = +firstEma.toFixed(8);

    for (var i = timePeriod; i < dataObjArray.length; i++) {
        var ema = dataObjArray[i].price * K + dataObjArray[i - 1]['ema-' + timePeriod] * (1 - K);
        dataObjArray[i]['ema-' + timePeriod] = +ema.toFixed(8);
    };
};

function macdCalculate(dataEma) {
    dataEma.forEach(function (item, i) {
        if (dataEma[i]['ema-12'] && dataEma[i]['ema-26']) {
            dataEma[i].macd = Number((dataEma[i]['ema-12'] - dataEma[i]['ema-26']).toFixed(8));
        };
    });
};

function signalMACD(dataObjArray) {
    // dataObj = {
    //  time: Date,
    //   price: Number,
    //   ema12: Number,
    //   ema26: Number,
    //   macd: Number
    // }
    var timePeriod = 9;
    var K = 2 / (timePeriod + 1);

    var macdArr = dataObjArray.filter(function (item) {
        return !!item.macd;
    });
    var newDataArr = macdArr.slice(0, timePeriod);
    var avg = 0;
    newDataArr.forEach(function (item) {
        avg += +item.macd.toFixed(8);
    });
    var firstSignal = +(avg / timePeriod).toFixed(8);

    if (!macdArr[timePeriod - 1]) {
        return null;
    };

    macdArr[timePeriod - 1].signal = +firstSignal.toFixed(8);

    for (var i = timePeriod; i < macdArr.length; i++) {
        var signal = macdArr[i].macd * K + macdArr[i - 1].signal * (1 - K);
        macdArr[i].signal = +signal.toFixed(8);
    };
    return dataObjArray;
    // return dataObjArray.slice(macdArr.length).concat(macdArr);
};

function simpleMA(dataObjArray, timePeriod) {
    var newDataArr = dataObjArray.slice(0, timePeriod);
    var avg = 0;
    newDataArr.forEach(function (item) {
        avg += +item.price.toFixed(6);
    });
    dataObjArray[timePeriod - 1]['ma-' + timePeriod] = +(avg / timePeriod).toFixed(6);
    for (var i = timePeriod; i < dataObjArray.length; i++) {
        var _avg = 0;
        var calcArr = dataObjArray.slice(i - (timePeriod - 1), i + 1);
        calcArr.forEach(function (item) {
            _avg += +item.price.toFixed(6);
        });
        dataObjArray[i]['ma-' + timePeriod] = +(_avg / timePeriod).toFixed(6);
    };
};