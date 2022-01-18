import { Image } from 'native-base';
import React from 'react';

export const Logo = ({ uri }:any) => {
  return <Image source={uri} resizeMode="contain" alt=" " size="2xl"/>;
};
