export const getDateString = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const mm = m > 9 ? m : '0' + m;
    const dd = d > 9 ? d : '0' + d;

    return y + '-' + mm + '-' + dd;
}