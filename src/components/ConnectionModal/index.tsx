import React from 'react';
import {Modal as BsModal, Col} from 'react-bootstrap';
import { DappUI, useGetLoginInfo } from '@elrondnetwork/dapp-core';
import './index.scss';

const ConnectionModal = (props) => {
    const data = props.data;

    const {
        ExtensionLoginButton,
        WebWalletLoginButton,
        LedgerLoginButton,
        WalletConnectLoginButton
    } = DappUI;

    const colSizes = {
        lg: 2,
        md: 5,
        sm: 12,
    };

    // if wallet connected, close modal
    const { isLoggedIn } = useGetLoginInfo();
    React.useEffect(() => {
        if (isLoggedIn) {
            props.onHide();
        }
      }, [isLoggedIn]);

    return (
        <BsModal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            className='custom-auth-modal-container'
            >
            <BsModal.Body className='row'>
                <Col {...colSizes}>
                    <ExtensionLoginButton
                    callbackRoute={data.callbackRoute}
                    loginButtonText={'Extension'}
                    />
                </Col>
                <Col {...colSizes}>
                    <WebWalletLoginButton
                    callbackRoute={data.callbackRoute}
                    loginButtonText={'Web wallet'}
                    />
                </Col>
                <Col {...colSizes}>
                    <LedgerLoginButton
                    loginButtonText={'Ledger'}
                    callbackRoute={data.callbackRoute}
                    />
                </Col>
                <Col {...colSizes}>
                    <WalletConnectLoginButton
                    callbackRoute={data.callbackRoute}
                    loginButtonText={'Maiar'}
                    />
                </Col>
            </BsModal.Body>
        </BsModal>
    );
};

export default ConnectionModal;