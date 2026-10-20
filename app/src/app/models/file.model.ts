export interface FileDetailsEntity {
    HasFile: boolean;
    FileCount: number;
    FilesList: FileInfoEntity[];
}

export interface FileInfoEntity {
    FileId: string;
    OriginalName: string;
    FileExtension: string;
    ContentType: string;
    FileSize: number;
    Favourite: boolean;
    CreatedAt: string;
    UploadedAgo: string;
    ModifiedAt: string | null;
    Deleted: boolean;
    DeletedAt: string | null;
    AutoDeletingAt: string | null;
}

export interface FileRenameInputEntity {
    FileId: string;
    UpdatedFileName: string;
}

export interface FileDeleteInputEntity {
    FileId: string;
}

export interface FileFavouriteInputEntity {
    FileId: string;
    Favourite: boolean;
}

export interface FileDeleteEmitEntity {
    Deleted: boolean;
    FileId: string;
}