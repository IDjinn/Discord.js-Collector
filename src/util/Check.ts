


export default class CheckIf{
    public static isNumber(value) {
        return !isNaN(value);
    }

    public static isNumberInRange(value, min: number, max?: number){
        return this.isNumber(value) && value >= min && max ? value <= max : true;
    }

    public static isBool(value){
        return typeof value === 'boolean';
    }
}