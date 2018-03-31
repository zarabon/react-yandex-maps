// TODO: hoist statics and all this HOC stuff

import React from 'react';
import PropTypes from 'prop-types';

import { getDisplayName as name } from './util/getDisplayName';

import { omit } from './util/omit';

export function withYMaps(Component, waitForApi = false, modules = []) {
  class WithYMaps extends React.Component {
    constructor() {
      super();
      this._isMounted = false;
    }

    componentWillMount() {
      if (!this.context.ymaps) {
        throw new Error(
          "Couldn't find YMaps in the context. " +
            `Make sure that <${name(Component)} /> is inside <YMapsProvider />`
        );
      }
    }

    componentDidMount() {
      this._isMounted = true;

      this.context.ymaps
        .load()
        .then(api => {
          return Promise.all(
            modules
              .concat(this.props.modules)
              .map(moduleName => api.loadModule(moduleName))
          ).then(() => {
            if (this._isMounted === true) {
              this.forceUpdate();
              this.props.onLoad(api);
            }
          });
        })
        .catch(err => {
          if (this._isMounted === true) {
            this.props.onError(err);
          }
        });
    }

    componentWillUnmount() {
      this._isMounted = false;
    }

    render() {
      const { api } = this.context.ymaps;

      const shouldRender = waitForApi === false || api !== null;

      return (
        shouldRender &&
        React.createElement(
          Component,
          Object.assign(
            { ymaps: api },
            omit(this.props, ['onLoad', 'onError', 'modules'])
          )
        )
      );
    }
  }

  WithYMaps.displayName = `withYMaps(${name(Component)})`;

  WithYMaps.propTypes = {
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    modules: PropTypes.arrayOf(PropTypes.string),
  };

  WithYMaps.defaultProps = {
    onLoad: Function.prototype,
    onError: Function.prototype,
    modules: [],
  };

  WithYMaps.contextTypes = {
    ymaps: PropTypes.object,
  };

  return WithYMaps;
}