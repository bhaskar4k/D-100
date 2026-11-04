export interface UserProfileDetails {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    modifiedAt: string | null;
}
