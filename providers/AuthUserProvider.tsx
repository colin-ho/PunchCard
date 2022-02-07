import React, { useState, createContext, useEffect } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface AuthenticatedUserContextInterface {
    user?: FirebaseAuthTypes.User | null
    setUser?: React.Dispatch<React.SetStateAction<FirebaseAuthTypes.User | null>>
    displayName?: string
    setDisplayName?: React.Dispatch<React.SetStateAction<string>>
    needsLogin?: boolean
    setNeedsLogin?: React.Dispatch<React.SetStateAction<boolean>>
    subscriptions?: FirebaseFirestoreTypes.DocumentData[]
    favorites?: FirebaseFirestoreTypes.DocumentData[]
    subscribedTo?: FirebaseFirestoreTypes.DocumentData[]
    redeeming?:FirebaseFirestoreTypes.DocumentData[]
    stripeCustomerId?:string
}

export const AuthenticatedUserContext = createContext<AuthenticatedUserContextInterface>({});

export const AuthenticatedUserProvider: React.FC<React.ReactNode> = ({ children }) => {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    const [needsLogin, setNeedsLogin] = useState<boolean>(false);
    const [subscriptions, setSubscriptions] = useState<FirebaseFirestoreTypes.DocumentData[]>([])
    const [favorites, setFavorites] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    const [redeeming,setRedeeming] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    const [subscribedTo,setSubscribedTo] = useState<FirebaseFirestoreTypes.DocumentData[]>([])
    const [stripeCustomerId,setStripeCustomerId] = useState('')

    const handleSubscriptionChanges = async (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
        const subscriptionIds = snapshot?.docs.map((doc: FirebaseFirestoreTypes.DocumentData) => doc.data().subscriptionId);
        const temp = snapshot?.docs.map((doc: FirebaseFirestoreTypes.DocumentData) => doc.data());
        setSubscribedTo(temp)
        if (subscriptionIds && subscriptionIds.length !== 0) {
            const querySnapshot = await firestore().collection('subscriptions').where('id', 'in', subscriptionIds).get();
            const data: FirebaseFirestoreTypes.DocumentData[] = []
            querySnapshot.forEach((doc) => data.push(doc.data()))
            setSubscriptions(data);
        }else{
            setSubscriptions([]);
        }
    }

    const handleUserChanges = (snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => {
        setDisplayName(snapshot.data()?.displayName);
        setFavorites(snapshot.data()?.favorites);
        setStripeCustomerId(snapshot.data()?.stripeCustomerId)
    }

    const handleRedeemingChanges = (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
        const temp = snapshot?.docs.map((doc: FirebaseFirestoreTypes.DocumentData) => doc.data());
        setRedeeming(temp)
    }

    useEffect(() => {
        let subListener: ()=>void, userListener: ()=>void, redemptionListener:()=>void;
        if (user) {
            const subscribedToQuery = firestore().collection('subscribedTo').where('customerId','==',user.uid).where('status','!=','canceled') 
            subListener = subscribedToQuery.onSnapshot(handleSubscriptionChanges, err => console.log(err));

            const userQuery = firestore().collection('customers').doc(user.uid);
            userListener = userQuery.onSnapshot(handleUserChanges,err=>console.log(err));

            const redemptionsQuery = firestore().collection('redemptions').where('redeemedById','==',user.uid).where('collected','==',false).orderBy('redeemedAt','desc')
            redemptionListener = redemptionsQuery.onSnapshot(handleRedeemingChanges,err=>console.log(err))
            
        } else{
            setDisplayName('')
            setSubscriptions([])
            setSubscribedTo([])
            setFavorites([])
            setRedeeming([])
            setStripeCustomerId('')
        }

        return ()=>{
            subListener?.();
            userListener?.();
        }
    }, [user]);
    return (
        <AuthenticatedUserContext.Provider value={{ user, setUser, displayName, needsLogin, setNeedsLogin, subscriptions, favorites,redeeming,subscribedTo ,stripeCustomerId}}>
            {children}
        </AuthenticatedUserContext.Provider>
    );
};
