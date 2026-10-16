export class ErrorDto {
    readonly success: boolean = false;
    readonly message: string;
    readonly data: any;
    readonly status: number;

    constructor(data: any, message: string, status: number) {
        this.data = data;
        this.message = message;
        this.status = status;
    }
}