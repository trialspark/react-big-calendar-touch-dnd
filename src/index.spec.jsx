import React from 'react';
import { findDOMNode } from 'react-dom';
import { mount } from 'enzyme';
import { range, round, omit } from 'lodash-es';
import Calendar from 'react-big-calendar';
import moment from 'moment';
import './index.spec.less';
import withDragAndDrop from './index';

Calendar.setLocalizer(Calendar.momentLocalizer(moment));

const DNDCalendar = withDragAndDrop()(Calendar);

const uid = (() => {
  let counter = 0;

  return () => {
    counter += 1;
    return counter;
  };
})();

class Simulator {
  static createMouseEvent(type, x, y) {
    return new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      screenX: x,
      screenY: y,
      clientX: x,
      clientY: y,
      pageX: document.body.scrollLeft + x,
      pageY: document.body.scrollTop + y,
    });
  }

  constructor(wrapper) {
    this.element = findDOMNode(wrapper.node);

    this.currentTouch = null;
  }

  updateCurrentTouch(event) {
    if (event.type === 'touchend') {
      this.currentTouch = null;
    } else {
      this.currentTouch = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        id: event.touches[0].identifier,
      };
    }
  }

  createTouchEvent(type, x, y) {
    const touch = new Touch({
      identifier: this.currentTouch ? this.currentTouch.id : uid(),
      target: this.element,
      screenX: x,
      screenY: y,
      clientX: x,
      clientY: y,
      pageX: document.body.scrollLeft + x,
      pageY: document.body.scrollTop + y,
    });
    const event = new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type !== 'touchend' ? [touch] : [],
      changedTouches: [touch],
      targetTouches: [touch],
    });

    return event;
  }

  getTouchPoint(horizontal = 'middle', vertical = 'middle') {
    const rect = this.element.getBoundingClientRect();

    return {
      x: rect.left + (() => {
        switch (horizontal) {
          case 'left':
            return (rect.width / 3) / 2;
          case 'middle':
            return rect.width / 2;
          case 'right':
            return (rect.width / 2) + ((rect.width / 3) / 2);
          default:
            return null;
        }
      })(),
      y: rect.top + (() => {
        switch (vertical) {
          case 'top':
            return (rect.height / 3) / 2;
          case 'middle':
            return rect.height / 2;
          case 'bottom':
            return (rect.height / 2) + ((rect.height / 3) / 2);
          default:
            return null;
        }
      })(),
    };
  }

  down(horizontal, vertical) {
    const { x, y } = this.getTouchPoint(horizontal, vertical);
    const event = this.createTouchEvent('touchstart', x, y);

    this.updateCurrentTouch(event);
    this.element.dispatchEvent(event);

    return event;
  }

  move(x, y) {
    if (!this.currentTouch) {
      this.down();
    }

    const event = this.createTouchEvent(
      'touchmove',
      this.currentTouch.x + x,
      this.currentTouch.y + y,
    );

    this.updateCurrentTouch(event);
    this.element.dispatchEvent(event);

    return event;
  }

  press(horizontal, vertical) {
    const event = this.down(horizontal, vertical);

    jasmine.clock().tick(251);

    return event;
  }

  release() {
    const { x, y } = this.currentTouch;
    const event = this.createTouchEvent('touchend', x, y);

    jasmine.clock().tick(1);

    this.updateCurrentTouch(event);
    this.element.dispatchEvent(event);

    return event;
  }

  dragTo(x, y) {
    const startPosition = this.element.getBoundingClientRect();
    const xMove = x - startPosition.left;
    const yMove = y - startPosition.top;
    const biggerMove = Math.max(Math.abs(xMove), Math.abs(yMove));

    this.press();

    range(biggerMove).forEach(() => {
      const position = this.element.getBoundingClientRect();
      let xDelta = 0;
      let yDelta = 0;

      if (Math.round(position.left) !== x) {
        xDelta = (x > position.left) ? +1 : -1;
      }

      if (Math.round(position.top) !== y) {
        yDelta = (y > position.top) ? +1 : -1;
      }

      this.move(xDelta, yDelta);
    });

    this.release();
  }

  dragToTime(wrapper) {
    /* eslint-disable react/no-find-dom-node */
    const position = findDOMNode(wrapper.node).getBoundingClientRect();

    return this.dragTo(position.left, position.top);
  }

  click(horizontal, vertical) {
    const { x, y } = this.getTouchPoint(horizontal, vertical);
    const event = this.constructor.createMouseEvent('click', x, y);

    this.element.dispatchEvent(event);

    return event;
  }
}

describe('index', () => {
  let reactRoot;
  let props;
  let component;

  const event = title => (
    component.find('EventWrapper').filterWhere(node => node.prop('event').title === title)
  );

  const time = date => (
    component.find('TimeSlot').filterWhere(node => (
      node.prop('value').toISOString() === date.toISOString()
    ))
  );

  const day = date => (
    component.find('BackgroundWrapper').filterWhere(node => (
      node.prop('value').toISOString() === date.toISOString()
    ))
  );

  beforeAll(() => {
    reactRoot = document.createElement('div');
    reactRoot.className = 'react-root';

    document.body.appendChild(reactRoot);
  });

  afterAll(() => {
    document.body.removeChild(reactRoot);
  });

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2017, 5, 27, 4));

    props = {
      events: [
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
      ],
      defaultDate: new Date(2017, 5, 27),
      view: 'week',
      onView: jasmine.createSpy('onView()'),
      onEventDrop: jasmine.createSpy('onEventDrop()').and.callFake(({
        event: droppedEvent,
        start,
        end,
      }) => {
        component.setProps({
          events: component.prop('events').map(currentEvent => (
            currentEvent.id !== droppedEvent.id ?
              currentEvent : Object.assign({}, currentEvent, { start, end })
          )),
        });
      }),
    };
    component = mount(<DNDCalendar {...props} />, {
      attachTo: reactRoot,
    });
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    component.detach();
  });

  it('exists', () => {
    expect(component.type()).not.toBeNull();
  });

  it('adds a class when the user long-presses an event', () => {
    const first = event('First Event');
    const simulator = new Simulator(first);

    expect(first.hasClass('touch-dnd-dragging')).toBe(false);
    expect(simulator.element.style.transform).toBe('');
    simulator.press();
    expect(first.hasClass('touch-dnd-dragging')).toBe(true);
    expect(simulator.element.style.transform).toBe('scale(1.05)');
    simulator.release();
    expect(first.hasClass('touch-dnd-dragging')).toBe(false);
    expect(simulator.element.style.transform).toBe('');
  });

  it('does not move if there is no press', () => {
    const first = event('First Event');
    const simulator = new Simulator(first);

    simulator.move(2, 4);
    simulator.move(-1, -2);

    expect(simulator.element.style.transform).toBe('');
    simulator.release();
  });

  it('moves after a press', () => {
    const first = event('First Event');
    const simulator = new Simulator(first);
    const position = simulator.element.style.position;
    const top = simulator.element.style.top;
    const left = simulator.element.style.left;
    const width = simulator.element.style.width;
    const height = simulator.element.style.height;
    const initialPosition = simulator.element.getBoundingClientRect();

    simulator.press();
    expect(simulator.move(2, 4).defaultPrevented).toBe(true);
    expect(simulator.element.style.position).toBe('fixed');
    expect(simulator.element.style.top).toBe(`${round(initialPosition.top, 3)}px`);
    expect(simulator.element.style.left).toBe(`${round(initialPosition.left, 3)}px`);
    expect(simulator.element.style.width).toBe(`${round(initialPosition.width, 3)}px`);
    expect(simulator.element.style.height).toBe(`${round(initialPosition.height, 3)}px`);
    expect(simulator.element.style.transform).toBe('scale(1.05) translate3d(2px, 4px, 0px)');
    expect(simulator.element.style.transition).toBe('none');

    expect(simulator.move(-1, -2).defaultPrevented).toBe(true);
    expect(simulator.element.style.position).toBe('fixed');
    expect(simulator.element.style.top).toBe(`${round(initialPosition.top, 3)}px`);
    expect(simulator.element.style.left).toBe(`${round(initialPosition.left, 3)}px`);
    expect(simulator.element.style.width).toBe(`${round(initialPosition.width, 3)}px`);
    expect(simulator.element.style.height).toBe(`${round(initialPosition.height, 3)}px`);
    expect(simulator.element.style.transform).toBe('scale(1.05) translate3d(1px, 2px, 0px)');
    expect(simulator.element.style.transition).toBe('none');

    simulator.release();
    expect(simulator.move(1, 1).defaultPrevented).toBe(false);
    expect(simulator.element.style.position).toBe(position);
    expect(simulator.element.style.top).toBe(top);
    expect(simulator.element.style.left).toBe(left);
    expect(simulator.element.style.width).toBe(width);
    expect(simulator.element.style.height).toBe(height);
    expect(simulator.element.style.transform).toBe('');
    expect(simulator.element.style.transition).toBe('');
  });

  it('drops in the calendar', () => {
    const first = event('First Event');
    const simulator = new Simulator(first);

    simulator.dragToTime(time(new Date(2017, 5, 29, 3)));

    expect(props.onEventDrop).toHaveBeenCalledWith({
      start: new Date(2017, 5, 29, 3),
      end: new Date(2017, 5, 29, 6),
      event: first.prop('event'),
    });
  });

  it('does not call onEventDrop() if the event is not moved', () => {
    const first = event('First Event');
    const simulator = new Simulator(first);

    simulator.move(10, 10);
    simulator.release();

    expect(props.onEventDrop).not.toHaveBeenCalled();
  });

  it('does nothing if the event is dragged out of the calendar', () => {
    const first = event('First Event');
    const simulator = new Simulator(first);

    simulator.dragTo(100, -500);

    expect(props.onEventDrop).not.toHaveBeenCalled();
  });

  it('prevents clicks after a drag occurs', () => {
    const spy = jasmine.createSpy('spy()');

    function Event() {
      return <button className="custom-event" onClick={spy}>My Event</button>;
    }

    component.setProps({
      components: {
        event: Event,
      },
    });

    const simulator = new Simulator(event('First Event'));
    const button = new Simulator(event('First Event').find('.custom-event'));

    button.click();

    expect(spy).toHaveBeenCalled();
    spy.calls.reset();

    // A long press doesn't trigger a click
    simulator.press();
    simulator.release();
    button.click();
    expect(spy).not.toHaveBeenCalled();

    button.click();
    expect(spy).toHaveBeenCalled();
  });

  describe('in month view', () => {
    beforeEach(() => {
      component.setProps({ view: 'month' });
    });

    it('drops in the calendar', () => {
      const first = event('First Event');
      const eventObject = first.prop('event');
      const simulator = new Simulator(first);

      simulator.dragToTime(day(new Date(2017, 5, 15)));

      expect(props.onEventDrop).toHaveBeenCalledWith({
        event: eventObject,
        start: new Date(2017, 5, 15, 10),
        end: new Date(2017, 5, 15, 13),
      });
    });

    it('handles multi-day events', () => {
      const multi = event('Multi-day Event');
      const eventObject = multi.prop('event');
      const simulator = new Simulator(multi);

      simulator.dragToTime(day(new Date(2017, 5, 5)));

      expect(props.onEventDrop).toHaveBeenCalledWith({
        event: eventObject,
        start: new Date(2017, 5, 5, 10),
        end: new Date(2017, 5, 7, 13),
      });
    });
  });

  describe('with custom start/end props', () => {
    beforeEach(() => {
      component.setProps({
        events: component.prop('events').map(evt => Object.assign(omit(evt, ['start', 'end']), {
          startTime: evt.start,
          endTime: evt.end,
        })),
        startAccessor: 'startTime',
        endAccessor: evt => evt.endTime,
      });
    });

    it('works for time slots', () => {
      const first = event('First Event');
      const eventObject = first.prop('event');
      const simulator = new Simulator(first);

      simulator.dragToTime(time(new Date(2017, 5, 27, 17)));

      expect(props.onEventDrop).toHaveBeenCalledWith({
        event: eventObject,
        start: new Date(2017, 5, 27, 17),
        end: new Date(2017, 5, 27, 20),
      });
    });

    it('works for day slots', () => {
      component.setProps({ view: 'month' });

      const first = event('First Event');
      const eventObject = first.prop('event');
      const simulator = new Simulator(first);

      simulator.dragToTime(day(new Date(2017, 5, 15)));

      expect(props.onEventDrop).toHaveBeenCalledWith({
        event: eventObject,
        start: new Date(2017, 5, 15, 10),
        end: new Date(2017, 5, 15, 13),
      });
    });
  });
});
