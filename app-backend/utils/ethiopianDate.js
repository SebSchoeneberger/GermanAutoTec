import { EtDatetime } from 'abushakir';

export const getCurrentEthiopianDate = () => {
    const etDate = new EtDatetime();
    return {
        month: etDate.month,    // 1-13 (Meskerem to Pagume)
        year: etDate.year,      // Ethiopian year
        day: etDate.day
    };
};

export const getEthiopianMonthName = (monthNumber) => {
    const months = [
        'Meskerem', 'Tikimt', 'Hidar', 'Tahsas',
        'Tir', 'Yekatit', 'Megabit', 'Miazia',
        'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
    ];
    return months[monthNumber - 1];
}; 