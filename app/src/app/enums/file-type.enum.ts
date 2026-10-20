export enum FileType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',

    PDF = 'PDF',

    WORD = 'WORD',
    EXCEL = 'EXCEL',
    POWERPOINT = 'POWERPOINT',

    TEXT = 'TEXT',
    CSV = 'CSV',
    JSON = 'JSON',
    XML = 'XML',

    ARCHIVE = 'ARCHIVE',

    FONT = 'FONT',

    CODE = 'CODE',

    DOCUMENT = 'DOCUMENT',

    UNKNOWN = 'UNKNOWN'
}


export interface FileIcon {
    icon: string;
    color: string;
}


export const MIME_TYPE_MAP: Record<string, FileType> = {

    // =========================
    // IMAGES
    // =========================

    'image/jpeg': FileType.IMAGE,
    'image/jpg': FileType.IMAGE,
    'image/png': FileType.IMAGE,
    'image/gif': FileType.IMAGE,
    'image/webp': FileType.IMAGE,
    'image/bmp': FileType.IMAGE,
    'image/tiff': FileType.IMAGE,
    'image/svg+xml': FileType.IMAGE,
    'image/x-icon': FileType.IMAGE,
    'image/avif': FileType.IMAGE,
    'image/heic': FileType.IMAGE,
    'image/heif': FileType.IMAGE,
    'image/apng': FileType.IMAGE,


    // =========================
    // VIDEO
    // =========================

    'video/mp4': FileType.VIDEO,
    'video/mpeg': FileType.VIDEO,
    'video/webm': FileType.VIDEO,
    'video/ogg': FileType.VIDEO,
    'video/quicktime': FileType.VIDEO,
    'video/x-msvideo': FileType.VIDEO,
    'video/x-ms-wmv': FileType.VIDEO,
    'video/3gpp': FileType.VIDEO,
    'video/3gpp2': FileType.VIDEO,
    'video/x-matroska': FileType.VIDEO,
    'video/x-flv': FileType.VIDEO,


    // =========================
    // AUDIO
    // =========================

    'audio/mpeg': FileType.AUDIO,
    'audio/mp3': FileType.AUDIO,
    'audio/wav': FileType.AUDIO,
    'audio/x-wav': FileType.AUDIO,
    'audio/ogg': FileType.AUDIO,
    'audio/aac': FileType.AUDIO,
    'audio/flac': FileType.AUDIO,
    'audio/mp4': FileType.AUDIO,
    'audio/webm': FileType.AUDIO,
    'audio/midi': FileType.AUDIO,
    'audio/x-midi': FileType.AUDIO,
    'audio/amr': FileType.AUDIO,


    // =========================
    // PDF
    // =========================

    'application/pdf': FileType.PDF,


    // =========================
    // MICROSOFT WORD
    // =========================

    'application/msword': FileType.WORD,

    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        FileType.WORD,

    'application/vnd.ms-word.document.macroenabled.12':
        FileType.WORD,


    // =========================
    // MICROSOFT EXCEL
    // =========================

    'application/vnd.ms-excel': FileType.EXCEL,

    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        FileType.EXCEL,

    'application/vnd.ms-excel.sheet.macroenabled.12':
        FileType.EXCEL,


    // =========================
    // MICROSOFT POWERPOINT
    // =========================

    'application/vnd.ms-powerpoint':
        FileType.POWERPOINT,

    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        FileType.POWERPOINT,

    'application/vnd.ms-powerpoint.presentation.macroenabled.12':
        FileType.POWERPOINT,


    // =========================
    // TEXT
    // =========================

    'text/plain': FileType.TEXT,
    'text/markdown': FileType.TEXT,
    'text/rtf': FileType.TEXT,


    // =========================
    // CSV
    // =========================

    'text/csv': FileType.CSV,


    // =========================
    // JSON
    // =========================

    'application/json': FileType.JSON,
    'application/ld+json': FileType.JSON,


    // =========================
    // XML
    // =========================

    'application/xml': FileType.XML,
    'text/xml': FileType.XML,


    // =========================
    // ARCHIVES
    // =========================

    'application/zip': FileType.ARCHIVE,
    'application/x-zip-compressed': FileType.ARCHIVE,
    'application/x-rar-compressed': FileType.ARCHIVE,
    'application/vnd.rar': FileType.ARCHIVE,
    'application/x-7z-compressed': FileType.ARCHIVE,
    'application/gzip': FileType.ARCHIVE,
    'application/x-gzip': FileType.ARCHIVE,
    'application/x-tar': FileType.ARCHIVE,
    'application/x-bzip2': FileType.ARCHIVE,


    // =========================
    // FONTS
    // =========================

    'font/ttf': FileType.FONT,
    'font/otf': FileType.FONT,
    'font/woff': FileType.FONT,
    'font/woff2': FileType.FONT,
    'font/sfnt': FileType.FONT,


    // =========================
    // GENERIC BINARY
    // =========================

    'application/octet-stream': FileType.UNKNOWN
};


export const FILE_TYPE_ICON_MAP: Record<FileType, FileIcon> = {

    [FileType.IMAGE]: {
        icon: 'bi-file-earmark-image-fill',
        color: 'file-color-image'
    },

    [FileType.VIDEO]: {
        icon: 'bi-file-earmark-play-fill',
        color: 'file-color-video'
    },

    [FileType.AUDIO]: {
        icon: 'bi-file-earmark-music-fill',
        color: 'file-color-audio'
    },

    [FileType.PDF]: {
        icon: 'bi-file-earmark-pdf-fill',
        color: 'file-color-pdf'
    },

    [FileType.WORD]: {
        icon: 'bi-file-earmark-word-fill',
        color: 'file-color-word'
    },

    [FileType.EXCEL]: {
        icon: 'bi-file-earmark-excel-fill',
        color: 'file-color-excel'
    },

    [FileType.POWERPOINT]: {
        icon: 'bi-file-earmark-ppt-fill',
        color: 'file-color-powerpoint'
    },

    [FileType.TEXT]: {
        icon: 'bi-file-earmark-text-fill',
        color: 'file-color-text'
    },

    [FileType.CSV]: {
        icon: 'bi-filetype-csv',
        color: 'file-color-csv'
    },

    [FileType.JSON]: {
        icon: 'bi-filetype-json',
        color: 'file-color-json'
    },

    [FileType.XML]: {
        icon: 'bi-filetype-xml',
        color: 'file-color-xml'
    },

    [FileType.ARCHIVE]: {
        icon: 'bi-file-earmark-zip-fill',
        color: 'file-color-archive'
    },

    [FileType.FONT]: {
        icon: 'bi-file-earmark-font-fill',
        color: 'file-color-font'
    },

    [FileType.CODE]: {
        icon: 'bi-file-earmark-code-fill',
        color: 'file-color-code'
    },

    [FileType.DOCUMENT]: {
        icon: 'bi-file-earmark-fill',
        color: 'file-color-document'
    },

    [FileType.UNKNOWN]: {
        icon: 'bi-file-earmark-fill',
        color: 'file-color-unknown'
    }
};