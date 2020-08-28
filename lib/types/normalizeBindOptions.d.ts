/**
 * @param {any[]} args
 */
export default function normalizeBindOptions(...args: any[]): {
    port: number;
    address: string;
    callback: any;
};
