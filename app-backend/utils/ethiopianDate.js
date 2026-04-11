import { EtDatetime } from 'abushakir';

function pad2(v) {
    return String(v).padStart(2, '0');
}

function toEthiopianDatePartsFromEpochMs(epochMs) {
    const etDate = new EtDatetime(epochMs);
    return {
        year: etDate.year,
        month: etDate.month,
        day: etDate.day
    };
}

export const getCurrentEthiopianDate = () => {
    return toEthiopianDatePartsFromEpochMs(Date.now());
};

export const getEthiopianMonthName = (monthNumber) => {
    const months = [
        'Meskerem', 'Tikimt', 'Hidar', 'Tahsas',
        'Tir', 'Yekatit', 'Megabit', 'Miazia',
        'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
    ];
    return months[monthNumber - 1];
}; 

export const toEthiopianNumericDateStringFromDate = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return null;
    const { year, month, day } = toEthiopianDatePartsFromEpochMs(date.getTime());
    return `${year}-${pad2(month)}-${pad2(day)}`;
};

export const toEthiopianNumericDateStringFromGregorianDate = (yyyyMmDd) => {
    if (typeof yyyyMmDd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    const middayUtc = Date.UTC(y, m - 1, d, 12, 0, 0, 0);
    const { year, month, day } = toEthiopianDatePartsFromEpochMs(middayUtc);
    return `${year}-${pad2(month)}-${pad2(day)}`;
};