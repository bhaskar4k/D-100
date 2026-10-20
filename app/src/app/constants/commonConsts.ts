export const ResponseTypeColor = {
    SUCCESS: 1,
    WARNING: 2,
    INFO: 3,
    ERROR: 4
}

export type ResponseTypeColor = typeof ResponseTypeColor[keyof typeof ResponseTypeColor];

export const JwtTokenKey = "MY_CLOUD_JWT";
export const MenuToggleFlag = "MY_CLOUD_MENU_TOGGLE";