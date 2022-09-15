import React from 'react';
import { ReactComponent as HeartIcon } from '../../../assets/img/heart.svg';
import './index.scss';
import {
  SOCIAL_WEBSITE_URL
} from '../../../config';

const Footer = () => {
  return (
    <footer className='text-center'>
      <div>
        <a
          {...{
            target: '_blank'
          }}
          className='d-flex align-items-center'
          href={SOCIAL_WEBSITE_URL}
        >
          Made with <HeartIcon className='mx-1' /> by Odin Defi.
        </a>
      </div>
    </footer>
  );
};

export default Footer;
