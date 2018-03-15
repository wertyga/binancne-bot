// EMA [today] = (Price [today] x K) + (EMA [yesterday] x (1 – K))
export function exponentialMovingAverage(dataObjArray, timePeriod) {
    // dataObj = {
    //  time: Date,
    //   price: Number
    // }
    if(dataObjArray.length < timePeriod) {
        console.error('Data array must be more or equeal then time period!');
        return;
    };

    const K = 2 / (timePeriod + 1);

    const newDataArr = dataObjArray.slice(0, timePeriod);
    let avg = 0;
    newDataArr.forEach(item => {
        avg += +item.price;
    });
    const firstEma = avg / timePeriod;
    dataObjArray[timePeriod - 1][`ema-${timePeriod}`] = +(firstEma.toFixed(8));

    for(let i = timePeriod; i < dataObjArray.length; i++) {
        let ema = (dataObjArray[i].price * K) + (dataObjArray[i - 1][`ema-${timePeriod}`] * (1 - K));
        dataObjArray[i][`ema-${timePeriod}`] = +(ema.toFixed(8));
    };
};

export function macdCalculate(dataEma) {
    dataEma.forEach((item, i) => {
        if(dataEma[i]['ema-12'] && dataEma[i]['ema-26']) {
            dataEma[i].macd = Number((dataEma[i]['ema-12'] - dataEma[i]['ema-26']).toFixed(8));
        };
    });
};

export function signalMACD(dataObjArray) {
     // dataObj = {
    //  time: Date,
    //   price: Number,
    //   ema12: Number,
    //   ema26: Number,
    //   macd: Number
    // }
    const timePeriod = 9;
    const K = 2 / (timePeriod + 1);

    const macdArr = dataObjArray.filter(item => {
        return !!item.macd;
    });
    const newDataArr = macdArr.slice(0, timePeriod);
    let avg = 0;
    newDataArr.forEach(item => {
        avg += +item.macd.toFixed(8);
    });
    const firstSignal = +(avg / timePeriod).toFixed(8);
    macdArr[timePeriod - 1].signal = +firstSignal.toFixed(8);

    for(let i = timePeriod; i < macdArr.length; i++) {
        let signal = (macdArr[i].macd * K) + (macdArr[i - 1].signal * (1 - K));
        macdArr[i].signal = +signal.toFixed(8);
    };
    return dataObjArray;
    // return dataObjArray.slice(macdArr.length).concat(macdArr);
};

export function simpleMA(dataObjArray, timePeriod) {
    const newDataArr = dataObjArray.slice(0, timePeriod);
    let avg = 0;
    newDataArr.forEach(item => {
        avg += +item.price.toFixed(6);
    });
    dataObjArray[timePeriod - 1][`ma-${timePeriod}`] = +(avg / timePeriod).toFixed(6);
    for(let i = timePeriod; i < dataObjArray.length; i++) {
        let avg = 0;
        const calcArr = dataObjArray.slice(i - (timePeriod - 1), i + 1);
        calcArr.forEach(item => {
            avg += +item.price.toFixed(6);
        });
        dataObjArray[i][`ma-${timePeriod}`] = +(avg / timePeriod).toFixed(6);
    };
};