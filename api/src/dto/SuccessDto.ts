export class SuccessDto {
    readonly success: boolean = true;
    readonly message: string;
    readonly data: any;
    readonly statusCode: number;
    readonly extraData?: any;

    constructor(data: any, message: string, statusCode: number, extraData?: any) {
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;
        this.extraData = extraData;
    }
}