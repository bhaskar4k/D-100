import {
    FILE_TYPE_ICON_MAP,
    FileIcon,
    FileType,
    MIME_TYPE_MAP
} from '../enums/file-type.enum';


export function GetFileType(
    contentType: string | null | undefined
): FileType {

    if (!contentType) {
        return FileType.UNKNOWN;
    }

    const mimeType = contentType
        .split(';')[0]
        .trim()
        .toLowerCase();

    // Exact MIME type match
    if (MIME_TYPE_MAP[mimeType]) {
        return MIME_TYPE_MAP[mimeType];
    }

    // Generic MIME type detection
    return GetGenericFileType(mimeType);
}


function GetGenericFileType(mimeType: string): FileType {

    if (mimeType.startsWith('image/')) {
        return FileType.IMAGE;
    }

    if (mimeType.startsWith('video/')) {
        return FileType.VIDEO;
    }

    if (mimeType.startsWith('audio/')) {
        return FileType.AUDIO;
    }

    if (mimeType.startsWith('font/')) {
        return FileType.FONT;
    }

    if (mimeType.startsWith('text/')) {
        return FileType.TEXT;
    }

    return FileType.UNKNOWN;
}


export function GetFileIcon(
    contentType: string | null | undefined
): FileIcon {

    const fileType = GetFileType(contentType);

    return FILE_TYPE_ICON_MAP[fileType]
        ?? FILE_TYPE_ICON_MAP[FileType.UNKNOWN];
}


export function GetReadableFileSize(
    bytes: number | null | undefined,
    decimals: number = 2
): string {

    if (bytes === null || bytes === undefined || isNaN(bytes)) {
        return '0 Bytes';
    }

    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;

    const units = [
        'Bytes',
        'KB',
        'MB',
        'GB',
        'TB',
        'PB',
        'EB',
        'ZB',
        'YB'
    ];

    const index = Math.floor(Math.log(bytes) / Math.log(k));

    const size = bytes / Math.pow(k, index);

    return `${parseFloat(size.toFixed(decimals))} ${units[index]}`;
}