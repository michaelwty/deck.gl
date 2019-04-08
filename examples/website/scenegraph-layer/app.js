/* global fetch, setTimeout, clearTimeout */
import React, {Component} from 'react';
import {render} from 'react-dom';

import {StaticMap} from 'react-map-gl';
import DeckGL, {ScenegraphLayer} from 'deck.gl';

import {GLBScenegraphLoader, GLTFScenegraphLoader} from '@luma.gl/addons';
import {registerLoaders} from '@loaders.gl/core';

registerLoaders([GLBScenegraphLoader, GLTFScenegraphLoader]);

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
// mapbox style file path
const MAPBOX_STYLE =
  'https://rivulet-zhang.github.io/dataRepo/mapbox/style/map-style-dark-v9-no-labels.json';

const DATA_URL = 'https://opensky-network.org/api/states/all';
const MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb';
const REFRESH_TIME = 30000;

export const INITIAL_VIEW_STATE = {
  latitude: 39.1,
  longitude: -94.57,
  zoom: 3.8,
  maxZoom: 16,
  pitch: 0,
  bearing: 0
};

const DATA_INDEX = {
  UNIQUE_ID: 0,
  ORIGIN_COUNTRY: 2,
  LONGITUDE: 5,
  LATITUDE: 6,
  BARO_ALTITUDE: 7,
  VELOCITY: 9,
  TRUE_TRACK: 10,
  GEO_ALTITUDE: 13,
  POSITION_SOURCE: 16
};

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this._loadData();
  }

  componentWillUnmount() {
    if (this.state.nextTimeoutId) {
      clearTimeout(this.state.nextTimeoutId);
    }
  }

  _sort(data, oldData) {
    // In order to keep the animation smooth we need to always return the same
    // objects in the exact same order. This function will discard new objects
    // and only update existing ones.
    if (!oldData) {
      return data;
    }

    const dataAsObj = {};
    data.forEach(entry => (dataAsObj[entry[DATA_INDEX.UNIQUE_ID]] = entry));
    return oldData.map(entry => dataAsObj[entry[DATA_INDEX.UNIQUE_ID]] || entry);
  }

  _loadData() {
    fetch(DATA_URL)
      .then(resp => resp.json())
      .then(resp => {
        if (resp && resp.states) {
          const nextTimeoutId = setTimeout(() => this._loadData(), REFRESH_TIME);
          this.setState({data: this._sort(resp.states, this.state.data), nextTimeoutId});
        }
      });
  }

  _renderLayers() {
    const {data} = this.state;

    if (Array.isArray(data)) {
      return [
        new ScenegraphLayer({
          id: 'scenegraph-layer',
          data,
          pickable: true,
          sizeScale: 10,
          scenegraph: MODEL_URL,
          getPosition: d => [
            d[DATA_INDEX.LONGITUDE] || 0,
            d[DATA_INDEX.LATITUDE] || 0,
            d[DATA_INDEX.GEO_ALTITUDE] || 0
          ],
          getOrientation: d => [0, 180 + (d[DATA_INDEX.TRUE_TRACK] || 0), 90],
          getTranslation: [0, 0, 0],
          getScale: [1, 1, 1],
          transitions: {
            getPosition: REFRESH_TIME * 0.9
          }
        })
      ];
    }

    return [];
  }

  render() {
    const {viewState, controller = true, baseMap = true} = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        controller={controller}
      >
        {baseMap && (
          <StaticMap
            reuseMaps
            mapStyle={MAPBOX_STYLE}
            preventStyleDiffing={true}
            mapboxApiAccessToken={MAPBOX_TOKEN}
          />
        )}
      </DeckGL>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
