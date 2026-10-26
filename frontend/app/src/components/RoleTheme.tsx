import { createContext, useContext } from 'react';
import { palette } from '../lib/palette';

export const RoleTheme = createContext<string>(palette.volunteer.primary);
export function useRoleColor() { return useContext(RoleTheme); }
