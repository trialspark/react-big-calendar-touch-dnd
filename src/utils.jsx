/* eslint-disable import/prefer-default-export */
import prefixStyle from 'prefix-style';

export function changeStyles(element, unprefixedStyles) {
  /* eslint-disable no-param-reassign */

  // Get styles with browser prefixes.
  const styles = Object.keys(unprefixedStyles).reduce((result, prop) => Object.assign(result, {
    [prefixStyle(prop)]: unprefixedStyles[prop],
  }), {});
  const props = Object.keys(styles);
  // Save element's current styles.
  const current = props.reduce((result, prop) => Object.assign(result, {
    [prop]: element.style[prop],
  }), {});

  // Change the element's styles.
  for (const prop of props) {
    element.style[prop] = styles[prop];
  }

  // Return a function that, when called, will change the styles back to their pre-changed values.
  return () => {
    for (const prop of props) {
      element.style[prop] = current[prop];
    }
  };
}
