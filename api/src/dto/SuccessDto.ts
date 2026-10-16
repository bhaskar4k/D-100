export class SuccessDto {
    readonly success: boolean = true;
    readonly message: string;
    readonly data: any;
    readonly status: number;

    constructor(data: any, message: string, status: number) {
        this.data = data;
        this.message = message;
        this.status = status;
    }
}