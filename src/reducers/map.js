let defaultState = {
  mapConfig: {},
  viewparams: '',
  refreshIndicator: { status: 'hide' },
  measureComponent: { open: false },
  regProvComponent: {},
  options: {
    osservazioni: true,
    citizenscience: true,
    provider: true,
  }
};

export default function MapReducer(state = defaultState, action) {
  switch (action.type) {
    case 'SET_CONFIG':
      state = Object.assign({}, state, {
        mapConfig: action.config,
      });
      return state;

    case 'SET_VIEWPARAMS':
      state = Object.assign({}, state, {
        viewparams: action.payload['viewparams'],
      });
      return state;

    case 'LOCAL.CHANGEREFRESHINDICATOR':
      state = Object.assign({}, state, {
        refreshIndicator: action.payload['refreshIndicator']
      });
      return state;

    case 'LOCAL.CHANGEMEASURECOMPONENT':
      state = Object.assign({}, state, {
        measureComponent: action.payload['measureComponent']
      });
      return state;

    case 'LOCAL.CHANGELANG':
      state = Object.assign({}, state, {
        lang: action.payload['lang'],
      });
      return state;

    case 'LOCAL.CHANGEREGPROVCOMPONENT':
      state = Object.assign({}, state, {
        regProvComponent: action.payload['regProvComponent']
      });
      return state;

    case 'LOCAL.CHANGEOPTIONS':
      let { type, ...other } = action;
      let options = { ...state.options, ...other }
      console.log("MapReducer() ", JSON.stringify(other), ", options->", JSON.stringify(options));
      return { ...state, options };

    default:
      return state;
  }
}
