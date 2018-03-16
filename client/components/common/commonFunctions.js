export function calculatePercentProfit(currentPrice, buyPrice) {
    return +(((+currentPrice - +buyPrice) / (+buyPrice / 100)).toFixed(2));
};