/*
 * Copyright (c) 2018 vladzaitsev@gmail.com
 */

import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import keplerGlReducer from 'kepler.gl/reducers';
import appReducer from './app-reducer';
import { taskMiddleware } from 'react-palm/tasks';
import window from 'global/window';
import * as Immutable from 'immutable';
import { MAPID } from './app';
import debounce from 'lodash.debounce';
import { createAction } from 'redux-actions';

const customizedKeplerGlReducer = keplerGlReducer
    .initialState({
        uiState: {
            // hide side panel to disallower user customize the map
            readOnly: false,

            // customize which map control button to show
            mapControls: {
                visibleLayers: {
                    show: true
                },
                mapLegend: {
                    show: true,
                    active: true
                },
                toggle3d: {
                    show: false
                },
                splitMap: {
                    show: false
                }
            },
            // "mapStyle": {
            //     "bottomMapStyle": {
            //         "sources": {
            //             "aaa": {
            //                 "type": "raster",
            //                 "tiles": [
            //                     "http://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fplanet-disaster-data%2Fhurricane-harvey%2FSkySat_Freeport_s03_20170831T162740Z3.tif"
            //                 ],
            //                 "tileSize": 256
            //             }
            //         },
            //         "layers": [
            //             {
            //                 "id": "bbb",
            //                 "type": "raster",
            //                 "source": "aaa",
            //                 "layout": {
            //                     "visibility": "visible"
            //                 },
            //                 "paint": {
            //                     "raster-opacity": 1
            //                 }
            //             }
            //         ]
            //     },
            // }

        }
    })
    // handle additional actions
    .plugin({
        HIDE_AND_SHOW_SIDE_PANEL: (state, action) => ({
            ...state,
            uiState: {
                ...state.uiState,
                readOnly: !state.uiState.readOnly
            }
        }),

    });


const reducers = combineReducers({
    keplerGl: customizedKeplerGlReducer,
    app: appReducer
});
const composeTileLayerId = (dsid, cog_field_name) => `${dsid}_${cog_field_name}_cogurl`;

/**
 *  executes callback for mapbox layer that have tiles injected
 *
 *  params to invoke function :
 *  const oldLayer = state.keplerGl[MAPID].visState.layers[idx];
 *  console.log(oldLayer);
 *  const { config: { dataId, columns: { geojson } } } = oldLayer;
 *
 *  callback called with arguments (layerIdx, lid) where `layerIdx` is index in layers List and  `lid` is _sourceId_ of tiles layer
 *
 * @param keplerState
 * @param oldLayerConfig
 * @param callback
 * @returns {null}
 */
const processMapLyaer = (keplerState, { config: { dataId, columns: { geojson } } }, callback) => {
    if (geojson) {
        try {
            const dataset = keplerState.visState.datasets[dataId];
            if (dataset.fields[geojson.fieldIdx].type !== 'geojson' || dataset.fields[geojson.fieldIdx].name !== geojson.value) {
                console.error(`layer field dont have corresponding data field ${geojson.value} in ${dataset.label}`);
                return null
            }
            const lid = composeTileLayerId(dataId, geojson.value);
            let immutable_bottom = keplerState.mapStyle.bottomMapStyle;
            let new_kepler_layers = immutable_bottom.get('layers');
            let layerIdx = new_kepler_layers.findIndex(l => l.has('source') && l.get('source') === lid);
            if (layerIdx !== -1) {
                callback(layerIdx, lid);
            }
        } catch (e) {
            console.error('Exception while processing layer', e)
        }
    } else {
        console.warn('bad geojson')
    }
};

const processLAYER_CONFIG_CHANGE = (state, action) => {
    let keplerState = state.keplerGl[MAPID];
    if (!keplerState.mapStyle.bottomMapStyle) {
        return null;
    }

    let imutable_bottom = keplerState.mapStyle.bottomMapStyle;
    const newVisibility = action.payload.newConfig.isVisible ? 'visible' : 'hidden';
    processMapLyaer(keplerState, action.payload.oldLayer, (layerIdx) => {
        imutable_bottom = imutable_bottom.setIn(['layers', layerIdx, 'layout', 'visibility'], newVisibility);
    });
    if (keplerState.mapStyle.bottomMapStyle !== imutable_bottom) {
        keplerState.mapStyle.bottomMapStyle = imutable_bottom;
        return customizedKeplerGlReducer(state.keplerGl, action);
    }
    return null

};
const processDebouncedOpacity = (state, action) => {
    let keplerState = state.keplerGl[MAPID];
    if (!keplerState.mapStyle.bottomMapStyle) {
        return null;
    }

    const { newVisConfig: { opacity } } = action.payload;
    let immutable_bottom = keplerState.mapStyle.bottomMapStyle;
    processMapLyaer(keplerState, action.payload, (layerIdx) => {
        immutable_bottom = immutable_bottom.setIn(['layers', layerIdx, 'paint', 'raster-opacity'], opacity);
    });
    if (keplerState.mapStyle.bottomMapStyle !== immutable_bottom) {
        keplerState.mapStyle.bottomMapStyle = immutable_bottom;
        return customizedKeplerGlReducer(state.keplerGl, action);
    }
    return null

};
const processREMOVE_LAYER = (state, action) => {
    let keplerState = state.keplerGl[MAPID];
    if (!keplerState.mapStyle.bottomMapStyle) {
        return null;
    }
    const oldLayer = keplerState.visState.layers[action.payload.idx];
    const { config: { dataId, columns: { geojson } } } = oldLayer;
    let immutable_bottom = keplerState.mapStyle.bottomMapStyle;
    processMapLyaer(keplerState, oldLayer, (layerIdx, lid) => {
        immutable_bottom = immutable_bottom
            .update('layers', layers => layers.filterNot(layer => layer.has('source') && layer.get('source') === lid))
            .update('sources', sources => sources.filterNot((val, key) => key === lid))
        ;
    });
    if (keplerState.mapStyle.bottomMapStyle !== immutable_bottom) {
        keplerState.mapStyle.bottomMapStyle = immutable_bottom;
        return customizedKeplerGlReducer(state.keplerGl, action);
    }
    return null;
};


const processREMOVE_DATASET = (state, action) => {
    let keplerState = state.keplerGl[MAPID];
    if (!keplerState.mapStyle.bottomMapStyle) {
        return null;
    }
    const reg = new RegExp(`${action.payload.key}.+_cogurl`);
    keplerState.mapStyle.bottomMapStyle = keplerState.mapStyle.bottomMapStyle
        .update('layers', layers => layers.filterNot(layer => reg.test(layer.get('source'))))
        .update('sources', sources => sources.filterNot((val, key) => reg.test(key)))
    ;
    return customizedKeplerGlReducer(state.keplerGl, action);
};
const processADD_DATA_TO_MAP = (state, action) => {
    if (!action.payload.datasets || !action.payload.datasets.length) {
        return null;
    }
    if (!state.keplerGl[MAPID].mapStyle.bottomMapStyle) {
        console.error("Dataset loading while mapStyle is not ready");
        return null;
    }
    let keplerState = state.keplerGl[MAPID];
    let imutable_bottom = keplerState.mapStyle.bottomMapStyle;

    action.payload.datasets.forEach(dataset => {
        const geojsons = [];
        // console.log(dataset);
        dataset.data.fields.filter(f => f.type === 'geojson').forEach(geom => {

                dataset.data.rows.forEach(r => {
                    try {
                        //in .csv row has string, in .geojson it has object
                        const geo = typeof r[geom.tableFieldIndex - 1] === 'string'
                            ? JSON.parse(r[geom.tableFieldIndex - 1])
                            : r[geom.tableFieldIndex - 1];
                        if (geo.hasOwnProperty('properties') && geo.properties.hasOwnProperty('COGURL')) {
                            geojsons.push({ fname: geom.name, url: geo.properties.COGURL });
                            // console.log(geo.properties.COGURL);
                        }
                    } catch (e) {
                        console.error("Bad geojson", r[geom.tableFieldIndex - 1])
                    }
                });
            }
        );
        if (geojsons.length) {
            const dsid = dataset.info.id;


            geojsons.forEach((cog, i) => {
                const lid = composeTileLayerId(dsid, cog.fname);
                if (imutable_bottom.hasIn(['sources', lid])) {
                    // COG layer already exists, next geojson
                    return;
                }
                const urls = typeof cog.url === "string" ? [cog.url] : cog.url;
                const newSource = Immutable.fromJS({
                    type: 'raster',
                    tiles: [
                        ...urls
                        // 'http://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=https%3A%2F%2Foin-hotosm.s3.amazonaws.com/56f9b5a963ebf4bc00074e70/0/56f9c2d42b67227a79b4faec.tif',                                // ...urls
                    ],
                    tileSize: 256
                });
                // console.log(newSource);
                const newLayer = Immutable.fromJS({
                    'id': `${lid}_layer`,
                    'type': 'raster',
                    'source': lid,
                    'layout': {
                        'visibility': 'visible'
                    },
                    paint: {
                        'raster-opacity': 0.8,
                    }
                });
                imutable_bottom = imutable_bottom
                    .update('layers', layers => layers.push(newLayer))
                    .update('sources', sources => sources.set(lid, newSource));
            });

        }
    });
    if (keplerState.mapStyle.bottomMapStyle !== imutable_bottom) {
        state.keplerGl[MAPID].mapStyle.bottomMapStyle = imutable_bottom;
        return customizedKeplerGlReducer(state.keplerGl, action);
    }

    return null;
};

const debouncedOpacityAction = createAction('DEBOUNCED_OPACITY');
const composedReducer = (state, action) => {
    //TODO add debounce to opacity

    if (['DEBOUNCED_OPACITY'].includes(action.type)) {
        const new_kepler_state = processDebouncedOpacity(state, action);
        if (new_kepler_state) {
            return { ...state, keplerGl: new_kepler_state }
        }
    }
    if (['@@kepler.gl/LAYER_CONFIG_CHANGE'].includes(action.type)) {
        if (
            action.payload.newConfig && action.payload.newConfig.hasOwnProperty('isVisible')
        ) {
            const new_kepler_state = processLAYER_CONFIG_CHANGE(state, action);
            if (new_kepler_state) {
                return { ...state, keplerGl: new_kepler_state }
            }
        }
    }
    if (['@@kepler.gl/LAYER_VIS_CONFIG_CHANGE'].includes(action.type)) {
        if (action.payload.newVisConfig && action.payload.newVisConfig.hasOwnProperty('opacity')) {
            const { config: { dataId, columns: { geojson } } } = action.payload.oldLayer;
            //make payload layer-like
            dispatchDebouncedOpacity({
                config: {
                    dataId,
                    columns: { geojson },

                }, newVisConfig: { opacity: action.payload.newVisConfig.opacity }
            });
        }
    }
    if (['@@kepler.gl/REMOVE_DATASET'].includes(action.type)) {
        const new_kepler_state = processREMOVE_DATASET(state, action);
        if (new_kepler_state) {
            return { ...state, keplerGl: new_kepler_state }
        }

    }
    if (['@@kepler.gl/REMOVE_LAYER'].includes(action.type)) {
        const new_kepler_state = processREMOVE_LAYER(state, action);
        if (new_kepler_state) {
            return { ...state, keplerGl: new_kepler_state }
        }

    }
    // -------------- add tiles -----------------------------
    if (['@@kepler.gl/ADD_DATA_TO_MAP'].includes(action.type)) {
        // console.log(action.payload);
        const new_kepler_state = processADD_DATA_TO_MAP(state, action);
        if (new_kepler_state) {
            return { ...state, keplerGl: new_kepler_state }
        }
    }
    return reducers(state, action);
};

const middlewares = [taskMiddleware];
const enhancers = [applyMiddleware(...middlewares)];

const initialState = {};

// add redux devtools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
    composedReducer,
    initialState,
    composeEnhancers(...enhancers)
);


const dispatchDebouncedOpacity = debounce((payload) => {
    store.dispatch(debouncedOpacityAction(payload));
}, 300, {
    'leading': false,
    'trailing': true
});

export default store;
