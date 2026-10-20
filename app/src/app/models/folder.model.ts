export interface FolderDetailsEntity {
    HasFolder: boolean;
    FolderCount: number;
    FoldersList: FolderInfoEntity[];
}

export interface FolderInfoEntity {
    FolderId: string;
    FolderName: string;
    Depth: number;
    SubFolderCount: number;
    FilesCount: number;
    TotalSize: number;
    Favourite: boolean;
    CreatedAt: string;
    CreatedAgo: string;
    ModifiedAt: string | null;
    Deleted: boolean;
    DeletedAt: string | null;
    AutoDeletingAt: string | null;
}

export interface FolderCreateInputEntity {
    FolderId: string;
    FolderName: string;
}

export interface FolderRenameInputEntity {
    FolderId: string;
    UpdatedFolderName: string;
}

export interface FolderDeleteInputEntity {
    FolderId: string;
}

export interface FolderFavouriteInputEntity {
    FolderId: string;
    Favourite: boolean;
}

export interface FolderDeleteEmitEntity {
    Deleted: boolean;
    FolderId: string;
}

export interface SubfolderAndFileCountOutputEntity {
    TotalSubFolderCount: number;
    TotalFileCount: number;
}