import 'babel-polyfill';

const realNow = Date.now;
const stub = () => {
  if (Date.now === stub) {
    return realNow();
  }

  return Date.now();
};

Date.now = stub;
