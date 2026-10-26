export const EndpointType = {
    dev: "http://localhost:3000/",
    prod: "https://educarecenter-in-gogy.onrender.com/"
}

export function GetBaseURL() {
    let BaseUrl = EndpointType.dev;
    // let BaseUrl = EndpointType.prod;

    return BaseUrl + "Api/";
}

export const Endpoints = {
    Auth: {
        Register: "Authentication/Register",
        Login: "Authentication/Login",
    },
    Common: {
        GetMenu: "Common/GetMenu",
    },
    Dataset: {
        GetAll: "Dataset/GetAll",
        GetDeleted: "Dataset/GetDeleted",
        GetDetails: "Dataset/GetDetails",
        Preview: "Dataset/Preview",
        PrepareDownloadIngestedDataset: "Dataset/PrepareDownloadIngestedDataset",
        DownloadIngestedDataset: "Dataset/DownloadIngestedDataset",
        DownloadRawDataset: "Dataset/DownloadRawDataset",
        Process: "Dataset/Process",
        UpdateName: "Dataset/UpdateName",
        UpdateColumnName: "Dataset/UpdateColumnName",
        DeleteColumn: "Dataset/DeleteColumn",
        Delete: "Dataset/Delete",
        Restore: "Dataset/Restore",
    },
    Upload: {
        Initiate: "Upload/Initiate",
        Chunk: "Upload/Chunk",
        Complete: "Upload/Complete"
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