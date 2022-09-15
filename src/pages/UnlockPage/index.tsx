import React from 'react';
import { DappUI, useGetLoginInfo } from '@elrondnetwork/dapp-core';

export const UnlockRoute: (props: any) => JSX.Element = (props) => {
  const {
    ExtensionLoginButton,
    WebWalletLoginButton,
    LedgerLoginButton,
    WalletConnectLoginButton
  } = DappUI;
  const { isLoggedIn } = useGetLoginInfo();

  React.useEffect(() => {
    if (isLoggedIn) {
      window.location.href = props.loginRoute;
    }
  }, [isLoggedIn]);

  return (
    <div className='home d-flex flex-fill align-items-center'>
      <div className='m-auto' data-testid='unlockPage'>
        <div className='card my-4 text-center'>
          <div className='card-body py-4 px-2 px-sm-2 mx-lg-4'>
            <h4 className='mb-4'>Login</h4>
            <p className='mb-4'>pick a login method</p>

            <ExtensionLoginButton
              callbackRoute={props.loginRoute}
              loginButtonText={'Extension'}
            />
            <WebWalletLoginButton
              callbackRoute={props.loginRoute}
              loginButtonText={'Web wallet'}
            />
            <LedgerLoginButton
              loginButtonText={'Ledger'}
              callbackRoute={props.loginRoute}
              className={'test-class_name'}
            />
            <WalletConnectLoginButton
              callbackRoute={props.loginRoute}
              loginButtonText={'Maiar'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockRoute;