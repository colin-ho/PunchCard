import React, { useState, createContext, useEffect } from 'react';
import firestore ,{FirebaseFirestoreTypes}from '@react-native-firebase/firestore';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export const AuthenticatedUserContext = createContext({});

export const AuthenticatedUserProvider = ({ children }:any) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [needsLogin, setNeedsLogin] = useState<boolean>(false);
  const [subscriptions,setSubscriptions] = useState<FirebaseFirestoreTypes.DocumentData[]>([])
  const [favorites,setFavorites] = useState<FirebaseFirestoreTypes.DocumentData[]>([]); 

  useEffect(() => {
    // Moved inside "useEffect" to avoid re-creating on render
    const handleSubscriptionChanges=(snapshot : FirebaseFirestoreTypes.QuerySnapshot)=>{
        const all = snapshot?.docs.map((doc:FirebaseFirestoreTypes.DocumentData) => doc.data()); 
        const subscriptionIds = all.map((doc:FirebaseFirestoreTypes.DocumentData) => doc.subscriptionId); 
        let subscriptionsQuery;
        if(subscriptionIds && subscriptionIds.length!==0){
            subscriptionsQuery = firestore()
            .collectionGroup('subscriptions')
            .where('id', 'in', subscriptionIds)
            subscriptionsQuery.onSnapshot((snapshot)=>{
                const data= snapshot?.docs.map((doc) => doc.data());
                setSubscriptions(data);  
            })
        }
    }
    const handleFavoritesChanges = (snapshot:FirebaseFirestoreTypes.QuerySnapshot)=>{
      const ids = snapshot?.docs.map((doc:FirebaseFirestoreTypes.DocumentData) => doc.id); 
      setFavorites(ids)
    }
    let unsubscribe : any,unsubscribe2: any;
    if(user){
      const subscribedToQuery = firestore().collection('customers').doc(user.uid).collection('subscribedTo');
      unsubscribe = subscribedToQuery.onSnapshot(handleSubscriptionChanges, err => console.log(err));   
      const favoritesQuery = firestore().collection('customers').doc(user.uid).collection('favorites');
      unsubscribe2 = favoritesQuery.onSnapshot(handleFavoritesChanges,err=>console.log(err))
    }

    return ()=>{
        unsubscribe2?.()
        unsubscribe?.();
    }
}, [user]);
  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser,displayName, setDisplayName,needsLogin,setNeedsLogin,subscriptions,favorites }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};
