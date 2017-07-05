import React, { PureComponent } from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop from '../../src/index';

BigCalendar.setLocalizer(BigCalendar.momentLocalizer(moment));

const Calendar = withDragAndDrop()(BigCalendar);

const events = [
  {
    id: '1',
    start: new Date(2017, 5, 27, 10),
    end: new Date(2017, 5, 27, 13),
    title: 'First Event',
  },
  {
    id: '2',
    start: new Date(2017, 5, 28, 10),
    end: new Date(2017, 5, 30, 13),
    title: 'Multi-day Event',
  },
  {
    id: '3',
    start: new Date(2017, 5, 26, 11),
    end: new Date(2017, 5, 26, 13),
    title: 'Second Event',
  },
];

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      events,
    };
  }

  render() {
    return (<Calendar
      events={this.state.events}
      defaultDate={new Date(2017, 5, 27)}
      defaultView="month"
      onEventDrop={({ event: droppedEvent, start, end }) => {
        this.setState({
          events: this.state.events.map(event => (
            event.id !== droppedEvent.id ? event : Object.assign({}, event, { start, end })
          )),
        });
      }}
    />);
  }
}
