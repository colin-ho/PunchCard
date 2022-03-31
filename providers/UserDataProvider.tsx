import React, { useState, createContext, useEffect, useContext } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from './AuthUserProvider';

export interface UserDataContextInterface {
    displayName?: string
    subscriptions?: FirebaseFirestoreTypes.DocumentData[]
    favorites?: FirebaseFirestoreTypes.DocumentData[]
    subscribedTo?: FirebaseFirestoreTypes.DocumentData[]
    redeeming?:FirebaseFirestoreTypes.DocumentData[]
    stripeCustomerId?:string
}

export const UserDataContext = createContext<UserDataContextInterface>({});

export const UserDataProvider: React.FC<React.ReactNode> = ({ children }) => {
    const {user} = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)
    const [displayName, setDisplayName] = useState<string>('');
    const [subscriptions, setSubscriptions] = useState<FirebaseFirestoreTypes.DocumentData[]>([])
    const [favorites, setFavorites] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    const [redeeming,setRedeeming] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    const [subscribedTo,setSubscribedTo] = useState<FirebaseFirestoreTypes.DocumentData[]>([])
    const [stripeCustomerId,setStripeCustomerId] = useState('');

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
            const subscribedToQuery = firestore().collection('subscribedTo').where('customerId','==',user.uid)
            subListener = subscribedToQuery.onSnapshot(handleSubscriptionChanges, err => console.log("subListener: ",err));

            const userQuery = firestore().collection('customers').doc(user.uid);
            userListener = userQuery.onSnapshot(handleUserChanges,err=>console.log("userListener",err));

            const redemptionsQuery = firestore().collection('redemptions').where('redeemedById','==',user.uid).where('collected','==',false).orderBy('redeemedAt','desc')
            redemptionListener = redemptionsQuery.onSnapshot(handleRedeemingChanges,err=>console.log("redemptionListener",err))
            
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
            redemptionListener?.();
        }
    }, [user]);
    return (
        <UserDataContext.Provider value={{ displayName, subscriptions, favorites,redeeming,subscribedTo ,stripeCustomerId}}>
            {children}
        </UserDataContext.Provider>
    );
};
