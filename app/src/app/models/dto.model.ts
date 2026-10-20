export interface ApiResponseDto {
    statusCode: number;
    success: boolean;
    message: string;
    data?: any;
    extraData?: any;
}