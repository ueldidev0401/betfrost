import BigNumber from 'bignumber.js/bignumber.js';
import {
    Egld,
} from '@elrondnetwork/erdjs';
import {
    ONE_DAY_IN_SECONDS
} from '.';


function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
  }
  
function formatDate(date: Date) {
    return [
        date.toLocaleString('default', { month: 'long' }),
        padTo2Digits(date.getDate()),
        date.getFullYear(),
    ].join(' ');
}

export const convertTimestampToDate = (ts: number) => {
    const date = new Date(ts);
    return formatDate(date);
};

export const convertTimestampToDateTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString();
};

export const convertSecondsToDays = (ts: number) => {
    return (ts / 86400);
};

export const convertWeiToEgld = (v: any, precision = 4) => {
    const factor = Math.pow(10, precision);
    const number = parseFloat(Egld.raw(v).toDenominated());
    return Math.floor(number * factor) / factor;
};

export const convertWeiToEsdt = (v: any, decimals = 18, precision = 2) => {
    // conversion for BigNumber operation
    if (typeof(v) != typeof(BigNumber)) v = new BigNumber(v);

    const number = v.dividedBy(new BigNumber(Math.pow(10, decimals))).toNumber();
    const factor = Math.pow(10, precision);
    return Math.floor(number * factor) / factor;
};

export const convertEsdtToWei = (v: number, decimals = 18) => {
    const factor = Math.pow(10, decimals);
    return (new BigNumber(v)).multipliedBy(factor);
};

export const convertUndefinedToZero = (v: any) => {
    return v ? v : 0;
};

export const calculatePercentage = (dividend: any, divisor: any) => {
    return convertUndefinedToZero(dividend) / convertUndefinedToZero(divisor) * 100;
};

export const paddingTwoDigits = (num: any) => {
    return num.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
};

export const precisionfloor = (number: number, precision = 4) => {
    const factor = Math.pow(10, precision);
    return Math.floor(number * factor) / factor;
};

export const getDaysFromNow = (targetTimestamp: number) => {
    const ts = (targetTimestamp - (new Date()).getTime());
    return Math.floor(ts / ONE_DAY_IN_SECONDS);
};