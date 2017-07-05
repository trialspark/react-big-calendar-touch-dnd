import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import getDisplayName from 'react-display-name';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { accessor as getEventProp } from 'react-big-calendar/lib/utils/accessors';
import { accessor as accessorType } from 'react-big-calendar/lib/utils/propTypes';
import draggableEventWrapper from './draggable_event_wrapper';
import droppableDayWrapper from './droppable_day_wrapper';
import './index.less';

export default () => (Calendar) => {
  class WithDragAndDrop extends Component {
    constructor(props) {
      super(props);

      this.dnd = new EventEmitter();
      this.dropZones = [];

      this._getNewTimeSlotTimes = this._getNewTimeSlotTimes.bind(this);
      this._getNewDaySlotTimes = this._getNewDaySlotTimes.bind(this);
      this._handleAddDropZone = this._handleAddDropZone.bind(this);
      this._handleRemoveDropZone = this._handleRemoveDropZone.bind(this);
      this._handleDrop = this._handleDrop.bind(this);

      this.dnd.on('addDropZone', this._handleAddDropZone);
      this.dnd.on('removeDropZone', this._handleRemoveDropZone);
      this.dnd.on('drop', this._handleDrop);

      this._createComponents();
    }

    getChildContext() {
      return {
        dnd: this.dnd,
      };
    }

    componentWillUpdate(nextProps) {
      this._createComponents(nextProps);
    }

    _getEventTimes(event) {
      return {
        start: getEventProp(event, this.props.startAccessor),
        end: getEventProp(event, this.props.endAccessor),
      };
    }

    _getNewTimeSlotTimes(event, slot) {
      const { start, end } = this._getEventTimes(event);
      const eventLength = end - start;
      const newStart = slot;
      const newEnd = new Date(newStart.getTime() + eventLength);

      return {
        start: newStart,
        end: newEnd,
      };
    }

    _getNewDaySlotTimes(event, slot) {
      const { start, end } = this._getEventTimes(event);
      const eventLength = end - start;

      const newStart = new Date(
        slot.getFullYear(),
        slot.getMonth(),
        slot.getDate(),
        start.getHours(),
        start.getMinutes(),
        start.getSeconds(),
        start.getMilliseconds(),
      );
      const newEnd = new Date(newStart.getTime() + eventLength);

      return {
        start: newStart,
        end: newEnd,
      };
    }

    _handleAddDropZone(api) {
      this.dropZones.push(api);
    }

    _handleRemoveDropZone(api) {
      this.dropZones.splice(this.dropZones.indexOf(api), 1);
    }

    _handleDrop(eventPosition, event) {
      const { start, end } = this._getEventTimes(event);
      const intersecting = this.dropZones.map(api => ({
        overlap: api.getIntersectionPercentageWith(eventPosition),
        date: api.getDate(),
        getNewTimes: api.getNewTimes,
      })).filter(({ overlap }) => (
        overlap > 0.5
      ));

      // Sort to put most-recent time slot at the beginning of the array.
      intersecting.sort((a, b) => a.date - b.date);

      if (intersecting.length === 0) {
        return;
      }

      const {
        start: newStart,
        end: newEnd,
      } = intersecting[0].getNewTimes(event, intersecting[0].date);

      if (start.getTime() !== newStart.getTime() || end.getTime() !== newEnd.getTime()) {
        this.props.onEventDrop({
          event,
          start: newStart,
          end: newEnd,
        });
      }
    }

    _getComponent(type, props = this.props) {
      return (props.components && props.components[type]) || Calendar.components[type];
    }

    _createComponents(props = this.props, prevProps = this.props) {
      const EventWrapper = this._getComponent('eventWrapper');
      const PrevEventWrapper = this._getComponent('eventWrapper', prevProps);
      const DayWrapper = this._getComponent('dayWrapper');
      const PrevDayWrapper = this._getComponent('dayWrapper', prevProps);
      const DateCellWrapper = this._getComponent('dateCellWrapper');
      const PrevDateCellWrapper = this._getComponent('dateCellWrapper', prevProps);

      if (!this.DraggableEventWrapper || EventWrapper !== PrevEventWrapper) {
        this.DraggableEventWrapper = draggableEventWrapper()(EventWrapper);
      }

      if (!this.DroppableDayWrapper || DayWrapper !== PrevDayWrapper) {
        this.DroppableDayWrapper = droppableDayWrapper({
          getNewTimes: this._getNewTimeSlotTimes,
        })(DayWrapper);
      }

      if (!this.DroppableDateCellWrapper || DateCellWrapper !== PrevDateCellWrapper) {
        this.DroppableDateCellWrapper = droppableDayWrapper({
          getNewTimes: this._getNewDaySlotTimes,
        })(DateCellWrapper);
      }
    }

    render() {
      const passed = Object.assign({}, this.props, {
        components: Object.assign({}, this.props.components, {
          eventWrapper: this.DraggableEventWrapper,
          dayWrapper: this.DroppableDayWrapper,
          dateCellWrapper: this.DroppableDateCellWrapper,
        }),
      });

      return <Calendar {...passed} />;
    }
  }

  WithDragAndDrop.propTypes = {
    components: PropTypes.shape({}),
    onEventDrop: PropTypes.func.isRequired,
    startAccessor: accessorType.isRequired,
    endAccessor: accessorType.isRequired,
  };

  WithDragAndDrop.defaultProps = {
    onEventDrop: () => {},
    startAccessor: 'start',
    endAccessor: 'end',
  };

  WithDragAndDrop.childContextTypes = {
    dnd: PropTypes.instanceOf(EventEmitter).isRequired,
  };

  WithDragAndDrop.displayName = `WithDragAndDrop(${getDisplayName(Calendar)})`;

  WithDragAndDrop.WrappedComponent = Calendar;

  return hoistNonReactStatics(WithDragAndDrop, Calendar);
};
