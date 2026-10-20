export const ResponseTypeColor = {
    SUCCESS: 1,
    WARNING: 2,
    INFO: 3,
    ERROR: 4
}

export type ResponseTypeColor = typeof ResponseTypeColor[keyof typeof ResponseTypeColor];

export const JwtTokenKey = "D_100_JWT";
export const MenuToggleFlag = "D_100_MENU_TOGGLE";