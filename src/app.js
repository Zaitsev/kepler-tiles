/*
 * Copyright (c) 2018 vladzaitsev@gmail.com
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
import KeplerGl from 'kepler.gl';
import { createAction } from 'redux-actions';

import { addDataToMap, wrapTo } from 'kepler.gl/actions';
import config from './configurations/config.json';

const MAPBOX_TOKEN = "pk.eyJ1IjoidmxhZHphaXRzZXYiLCJhIjoiY2ptOTFpcXJhMDEwZTNzcTlwOHl3eXpqbSJ9.mI1ppBX66g6wC3N2yP3WJA"; // eslint-disable-line

// extra actions plugged into kepler.gl reducer (store.js)
const hideAndShowSidePanel = createAction('HIDE_AND_SHOW_SIDE_PANEL');
export const MAPID="map1";

class App extends Component {
  componentDidMount() {
    this.props.dispatch(
      wrapTo('map1', addDataToMap(
        {
           // datasets: sampleData,
           datasets: [],
          config
        })
      )
    );
  }

  _toggleSidePanelVisibility = () => {
    this.props.dispatch(
      wrapTo('map1', hideAndShowSidePanel())
    );
  };

  render() {
    return (
      <div style={{position: 'absolute', width: '100%', height: '100%'}}>
          <button onClick={this._toggleSidePanelVisibility}> Hide / Show Side Panel</button>
          <AutoSizer>
            {({height, width}) => (
            <KeplerGl
              mapboxApiAccessToken={MAPBOX_TOKEN}
              id={MAPID}
              width={width}
              height={height}
            />
          )}
          </AutoSizer>
      </div>
    );
  }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
