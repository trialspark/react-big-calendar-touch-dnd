import { EventEmitter } from 'events';
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import getDisplayName from 'react-display-name';
import hoistNonReactStatics from 'hoist-non-react-statics';

class DropZoneAPI {
  constructor(params) {
    for (const key of Object.keys(params)) {
      this[key] = params[key];
    }
  }

  getPosition() {
    /* eslint-disable react/no-find-dom-node */
    return findDOMNode(this.component).getBoundingClientRect();
  }

  getDate() {
    return this.component.props.value;
  }

  getIntersectionPercentageWith(droppedPosition) {
    const position = this.getPosition();
    // The area that the drop zone and event overlap
    const overlapArea = Math.max(
      0,
      Math.min(
        droppedPosition.right,
        position.right,
      ) - Math.max(
        droppedPosition.left,
        position.left,
      )
    ) * Math.max(
      0,
      Math.min(
        droppedPosition.bottom,
        position.bottom,
      ) - Math.max(
        droppedPosition.top,
        position.top,
      )
    );
    // The maximum amount that the event and drop zone _could_ overlap.
    const maxOverlapArea = Math.min(
      position.width, droppedPosition.width
    ) * Math.min(
      position.height, droppedPosition.height
    );

    // Amount of overlap vs maximum possible overlap
    return overlapArea / maxOverlapArea;
  }
}

export default ({
  getNewTimes = () => ({}),
} = {}) => (DayWrapper) => {
  class DroppableDayWrapper extends Component {
    constructor(props) {
      super(props);

      this.api = new DropZoneAPI({
        getNewTimes,
        component: this,
      });
    }

    componentDidMount() {
      this.context.dnd.emit('addDropZone', this.api);
    }

    componentWillUnmount() {
      this.context.dnd.emit('removeDropZone', this.api);
    }

    render() {
      return <DayWrapper {...this.props} />;
    }
  }

  DroppableDayWrapper.propTypes = {
    value: PropTypes.instanceOf(Date).isRequired, // eslint-disable-line react/no-unused-prop-types
  };

  DroppableDayWrapper.contextTypes = {
    dnd: PropTypes.instanceOf(EventEmitter).isRequired,
  };

  DroppableDayWrapper.displayName = `Droppable(${getDisplayName(DayWrapper)})`;

  DroppableDayWrapper.WrappedComponent = DayWrapper;

  return hoistNonReactStatics(DroppableDayWrapper, DayWrapper);
};
