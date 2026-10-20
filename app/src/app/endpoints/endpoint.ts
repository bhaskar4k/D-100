export const EndpointType = {
    dev: "http://localhost:8080/",
    prod: "https://educarecenter-in-gogy.onrender.com/"
}

export function GetBaseURL() {
    let BaseUrl = EndpointType.dev;
    // let BaseUrl = EndpointType.prod;

    return BaseUrl + "api/";
}

export const Endpoints = {
    Auth: {
        Register: "auth/user/create",
        Login: "auth/user/login",
    },
    Common: {
        GetMenu: "common/menu/get-menu",
    },
    Upload: {
        Initiate: "file/upload/initiate",
        Chunk: "file/upload/chunk"
    },
    Download: {
        SingleFile: "file/download/single-file"
    },
    Folder: {
        ValidateFolderAccess: "file/folder/validate-folder-access",
        Create: "file/folder/create",
        GetAll: "file/folder/get-all",
        GetAllFavourite: "file/folder/get-all-favourite",
        GetSubfolderAndFileCount: "file/folder/get-sub-folder-and-file-count",
        Rename: "file/folder/rename",
        Delete: "file/folder/delete",
        UpdateFavourite: "file/folder/update-favourite",
    },
    File: {
        Get: "file/file/get",
        GetAll: "file/file/get-all",
        GetAllFavourite: "file/file/get-all-favourite",
        Rename: "file/file/rename",
        Delete: "file/file/delete",
        UpdateFavourite: "file/file/update-favourite",
    }
}