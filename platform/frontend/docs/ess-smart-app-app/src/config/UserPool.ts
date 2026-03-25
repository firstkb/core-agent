import { CognitoUserPool, ICognitoUserPoolData } from 'amazon-cognito-identity-js';


function getLocalStorageItem(key: string): string {
  const value = localStorage.getItem(key);
  if (value === null) {
    throw new Error(`Error: key "${key}" not found in localStorage`);
  }
  return value;
}

export let emailUserPool: CognitoUserPool;
export let phoneUserPool: CognitoUserPool;

try {
  const userPoolIdEmail = getLocalStorageItem('userPoolId');
  const appClientEmailId = getLocalStorageItem('appClientEmailId');
  const userPoolIdPhone = getLocalStorageItem('userPoolId');
  const appClientPhoneId = getLocalStorageItem('appClientPhoneId');

  const emailPoolData: ICognitoUserPoolData = {
    UserPoolId: userPoolIdEmail,
    ClientId: appClientEmailId,
  };

  const phonePoolData: ICognitoUserPoolData = {
    UserPoolId: userPoolIdPhone,
    ClientId: appClientPhoneId,
  };

  
  emailUserPool = new CognitoUserPool(emailPoolData);
  phoneUserPool = new CognitoUserPool(phonePoolData);

} catch (error) {
  console.error(error);
}


