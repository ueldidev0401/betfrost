import * as React from 'react';
import { Row } from 'react-bootstrap';
import Countdown from 'react-countdown';
import { paddingTwoDigits } from '../../utils/convert';

const CountDown = (props) => {
  // console.log('CountDown props', props);
  interface Props {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }

  const renderer: React.FC<Props> = ({ days, hours, minutes, seconds }) => {
    return (
      <Row className='custom-timer'>
          <div className='customer-timer-time'>{days}d : {hours}h : {minutes}m : {seconds}s</div>
      </Row>
    );
  };

  return (
    <Countdown date={new Date(props.targetTimestamp)} renderer={renderer} />
  );
};

export default CountDown;