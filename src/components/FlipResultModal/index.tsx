import React from 'react';
import {Modal as BsModal, Button} from 'react-bootstrap';
import './index.scss';

const FlipResultModal = (props) => {
    const data = props.data;
    return (
        <BsModal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            className='fate-flip-result-modal-container'
            >
            {/* <BsModal.Title id="contained-modal-title-vcenter">
                Note
            </BsModal.Title> */}
            <BsModal.Body className={data.flipResult ? 'success' : 'fail'}>
                <p>{data.flipResult ? 'You were right.' : 'You were wrong.'}</p>
                <p>{data.flipResult ? 'Wiser than Mimir, Greater than Odin.' : 'Fate of Gods shan\'t be you can read.'}</p>
            </BsModal.Body>
            <BsModal.Footer>
                <Button onClick={props.onHide}>Close</Button>
            </BsModal.Footer>
        </BsModal>
    );
};

export default FlipResultModal;