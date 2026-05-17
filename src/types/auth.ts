export interface User {
    id: string;
    name: string;
    email: string;
}

export interface StoredUser extends User {
    password: string;
}

export interface AuthResponse {
    success: boolean;
    error?: string;
    user?: User;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<AuthResponse>;
    register: (
        name: string,
        email: string,
        password: string
    ) => Promise<AuthResponse>;
    logout: () => void;
    deleteAccount: (email: string) => void;
    getAllUsers: () => { email: string; name: string }[];
}