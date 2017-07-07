import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import getDisplayName from 'react-display-name';
import hoistNonReactStatics from 'hoist-non-react-statics';
import Hammer from 'hammerjs';
import prefixStyle from 'prefix-style';
import { changeStyles } from './utils';

const SELECTED_SCALE = 'scale(1.05)';

export default () => (EventWrapper) => {
  class DraggableEventWrapper extends Component {
    constructor(props) {
      super(props);

      this.mc = null;
      this.resetStyles = null;
      this.initialPosition = null;

      this._handlePress = this._handlePress.bind(this);
      this._handlePan = this._handlePan.bind(this);
      this._handlePressUp = this._handlePressUp.bind(this);
    }

    componentDidMount() {
      this.mc = new Hammer(findDOMNode(this), {
        // Force touch detection when testing
        inputClass: window.__karma__ ? Hammer.TouchInput : undefined,
      });

      this.mc.get('pan').set({
        threshold: 0,
      });

      this.mc.on('press', this._handlePress);
      this.mc.on('pressup panend', this._handlePressUp);
    }

    componentWillUnmount() {
      this.mc.off();
      this.mc.destroy();
    }

    _handlePress() {
      this.initialPosition = this.mc.element.getBoundingClientRect();

      this.mc.element.classList.add('touch-dnd-dragging');
      this.mc.element.style[prefixStyle('transform')] = SELECTED_SCALE;

      this.mc.on('pan', this._handlePan);
    }

    _handlePan(event) {
      const { deltaX, deltaY } = event;
      const { element } = this.mc;

      event.preventDefault();

      element.style[prefixStyle('transform')] = `${SELECTED_SCALE} translate3d(${deltaX}px, ${deltaY}px, 0)`;

      const reset = changeStyles(element, {
        transition: 'none',
        position: 'fixed',
        top: `${this.initialPosition.top}px`,
        left: `${this.initialPosition.left}px`,
        width: `${this.initialPosition.width}px`,
        height: `${this.initialPosition.height}px`,
      });

      if (!this.resetStyles) {
        // Save function that will reset all styles to their initial values
        this.resetStyles = reset;
      }
    }

    _handlePressUp() {
      const { dnd } = this.context;
      const { event } = this.props;

      // Prevent a click from firing after dragging
      const preventClick = (e) => {
        e.stopImmediatePropagation();
        e.currentTarget.removeEventListener('click', preventClick, false);
      };
      this.mc.element.addEventListener('click', preventClick, false);

      // Clean up added styles/listeners
      if (this.resetStyles) {
        this.resetStyles();
        this.resetStyles = null;
      }
      this.initialPosition = null;
      this.mc.element.classList.remove('touch-dnd-dragging');
      this.mc.off('pan', this._handlePan);

      // Notify time slots of drop
      dnd.emit('drop', this.mc.element.getBoundingClientRect(), event);

      // Finally, remove drag delta positioning
      if (this.mc.element) {
        this.mc.element.style[prefixStyle('transform')] = '';
      }
    }

    render() {
      return <EventWrapper {...this.props} />;
    }
  }

  DraggableEventWrapper.propTypes = {
    event: PropTypes.shape({}).isRequired,
  };

  DraggableEventWrapper.contextTypes = {
    dnd: PropTypes.instanceOf(EventEmitter).isRequired,
  };

  DraggableEventWrapper.displayName = `Draggable(${getDisplayName(EventWrapper)})`;

  DraggableEventWrapper.WrappedComponent = EventWrapper;

  return hoistNonReactStatics(DraggableEventWrapper, EventWrapper);
};
