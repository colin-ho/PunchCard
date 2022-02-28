import React, { useState, createContext } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface AuthenticatedUserContextInterface {
    user?: FirebaseAuthTypes.User | null
    setUser?: React.Dispatch<React.SetStateAction<FirebaseAuthTypes.User | null>>
}

export const AuthenticatedUserContext = createContext<AuthenticatedUserContextInterface>({});

export const AuthenticatedUserProvider: React.FC<React.ReactNode> = ({ children }) => {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    return (
        <AuthenticatedUserContext.Provider value={{ user, setUser}}>
            {children}
        </AuthenticatedUserContext.Provider>
    );
};
