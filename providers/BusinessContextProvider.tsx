import React,{useEffect,useState,createContext} from 'react';
import {GOOGLE_API_KEY} from '@env';
import firestore ,{FirebaseFirestoreTypes}from '@react-native-firebase/firestore';
import Geolocation from 'react-native-geolocation-service';
import { Alert, Linking } from 'react-native';
import Geocoder from 'react-native-geocoding';

Geocoder.init(GOOGLE_API_KEY);
const geofire = require('geofire-common');

const hasPermissionIOS = async () => {
  const openSetting = () => {
    Linking.openURL('app-settings:').catch(() => {
      Alert.alert('Unable to open settings');
    });
  };
  const status = await Geolocation.requestAuthorization('whenInUse');

  if (status === 'granted') {
    return true;
  }

  if (status === 'denied') {
    Alert.alert(
        `Allow PunchCard to determine your location in order to discover shops.`,
        '',
        [
          { text: 'Go to Settings', onPress: openSetting },
        ],
      );
  }

  if (status === 'disabled') {
    Alert.alert(
      `Turn on Location Services to allow PunchCard to determine your location.`,
      '',
      [
        { text: 'Go to Settings', onPress: openSetting },
        { text: "Don't Use Location", onPress: () => {} },
      ],
    );
  }

  return false;
};

const hasLocationPermission = async () => {
  const hasPermission = await hasPermissionIOS();
  return hasPermission;
};

export interface BusinessContextInterface {
    businesses?:FirebaseFirestoreTypes.DocumentData[]
    refreshing?:boolean
    setRefreshing?:React.Dispatch<React.SetStateAction<boolean>>
    address?:string
    location?:Geolocation.GeoCoordinates | null
}

export const BusinessContext = createContext<BusinessContextInterface>({});

export const BusinessContextProvider:React.FC<React.ReactNode> = ({ children }) => {
    const [location, setLocation] = useState<Geolocation.GeoCoordinates | null>(null);
    const [address,setAddress] = useState<string>('');
    const [businesses, setBusinesses] = useState<FirebaseFirestoreTypes.DocumentData[] >([]);
    const [refreshing,setRefreshing] = useState<boolean>(false);
  
    const getStuff = ()=>{
        const center = [location?.latitude,location?.longitude];
        const radiusInM = 20 * 1000;
        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = [];
        for (const b of bounds) {
          const q = firestore().collection('businesses')
            .orderBy('geohash')
            .startAt(b[0])
            .endAt(b[1]);
    
          promises.push(q.get());
        }
        Promise.all(promises).then((snapshots) => {
          let matchingDocs = [];
        
          for (const snap of snapshots) {
            for (const doc of snap.docs) {
              const lat = doc.get('lat');
              const lng = doc.get('lng');
        
              // We have to filter out a few false positives due to GeoHash
              // accuracy, but most will match
              const distanceInKm = geofire.distanceBetween([lat, lng], center);
              const distanceInM = distanceInKm * 1000;
              if (distanceInM <= radiusInM) {
                let data = doc.data();
                data.distance = distanceInM;
                matchingDocs.push(data);
              }
            }
            
          }
          matchingDocs.sort((a, b) => (a.distance > b.distance) ? 1 : -1)
          return matchingDocs;
        }).then((matchingDocs) => {
          setBusinesses(matchingDocs);
        });
    }

    useEffect(() => {
      (async () => {
        const hasPermission = await hasLocationPermission();
        if (!hasPermission) {
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            setLocation(position.coords);
            Geocoder.from({lat:position.coords.latitude,lng:position.coords.longitude}).then(json => {
              setAddress(json.results[0].address_components[0].long_name + " "+json.results[0].address_components[1].long_name)
              })
          },
          (error) => {
            Alert.alert(`Code ${error.code}`, error.message);
            setLocation(null);
            console.log(error);
          },
          {
            accuracy: {
              android: 'high',
              ios: 'best',
            },
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      })();

    }, [])
  
    useEffect(() => {
      if(location){
        getStuff();
      }
      else{
        setBusinesses([]);
      }
      setTimeout(function(){ setRefreshing(false); }, 2000);
    }, [location,refreshing])

  return (
    <BusinessContext.Provider value={{ businesses,refreshing,setRefreshing,address,location }}>
      {children}
    </BusinessContext.Provider>
  );
};
