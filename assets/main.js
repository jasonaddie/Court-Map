var geojson, // store the geojson shapes to load into the map
    data, // store the data that is currently being used
    shapes, // store the shapes that is currently being used
    i, // used in for loops as counter
    j, // used in for loops as counter
    data_item, // used when getting data to load into a shape
    court_type_id = 'region', // the currently selected court type id
    court_type, // the currently selected court type
    case_type_id, // the currently selected case type id
    case_type, // the currently selected case type
    case_types, // list of case types that are available in the current data
    year, // the currently selected year
    years, // list of years that are available in the current data
    urlParams = {}, // store querystring values - used to determine what default values are when page loads
    html, // use to build the filter button html
    tmp_court_type, // temporarly store a court type object
    tmp_case_type, // temporarly store a case type object
    active, // used when setting class for button to indicate that it is active
    buttons, // used when updating the state of the buttons
    row_data, // data used for table row
    button_clicked,// indicates which button was clicked on
    default_table_view_type = 'case_type', // indicates that the default view type for the table is case types
    table_view_type, // indicates that the current view type for the table
    current_locale; // indicate what the current locale is

//////////////////////////
// URL update functions
//////////////////////////

// get the current url querystring parameters
// values are saved into urlParams
function get_url_params(){
  var match,
      pl     = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.search.substring(1);

  urlParams = {};
  while (match = search.exec(query))
     urlParams[decode(match[1])] = decode(match[2]);
}

// if the back or forward button is clicked,
// reload the map with the correct values
window.addEventListener('popstate', function(event) {
  // record the new querystring values
  // - these will be used next to initialize the data and buttons
  get_url_params();

  // initialize the current selections, data, and buttons
  initialize_data_and_buttons();

  // load the shapes and data into the map
  load_map_data();

  // update the table with the correct data
  update_table();

  // update the page title
  update_page_title();

});

// update the url so it has querystring values
// of the current selections
// we do this in case someone shares the page people can
// return to the same view
function update_url() {
  // get the current url
  var url = window.location.href;
  // set what the querystring parameter values should be
  var params ={
    "court_type": court_type_id,
    "case_type": case_type_id,
    "year": year
  };
  // get the querystring parameter keys
  // makes it easier to go through each item
  // in the loop below
  var keys = Object.keys(params);

  for (i=0; i<keys.length; i++){
    // see if the key is already in the url
    var re = new RegExp("([?&])" + keys[i] + "=.*?(&|$)", "i");
    var separator = url.indexOf('?') !== -1 ? "&" : "?";
    if (url.match(re)) {
      // the key is already in the url, so update the value
      url = url.replace(re, '$1' + keys[i] + "=" + params[keys[i]] + '$2');
    }
    else {
      // the key is not in the url, so add it
      url += separator + keys[i] + "=" + params[keys[i]];
    }
  }

  // update the url
  window.history.pushState(params, create_page_title(), url);
}

//////////////////////////
// manage the page title
//////////////////////////

// create the text for the title
function create_page_title(){
  return year + ' ' + locales[current_locale].court_types[court_type.id] + ': ' + locales[current_locale].case_types[case_type.id] + ' ' + locales[current_locale].data;
}

// update the page title
function update_page_title(){
  document.title = create_page_title() + ' | ' + locales[current_locale].page_title;
}

// create the text for the title of the table
function create_table_title(){
  if (table_view_type == 'case_type'){
    return year + ' ' + locales[current_locale].court_types[court_type.id] + ' Data';
  }else if (table_view_type == 'year'){
    return locales[current_locale].court_types[court_type.id] + ': ' + locales[current_locale].case_types[case_type.id] + ' Data';
  }

}

//////////////////////////
// build buttons
//////////////////////////

// function to create button html
function build_button(button_type, active, id, text, fn){
  return '<button class="' + button_type + ' ' + active + '" data-id="' + id + '" onclick="' + fn + '(this)">' + text + '</button>';
}


//////////////////////////
// sort table functions
//////////////////////////

const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
    )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

//////////////////////////
// button interaction functions
//////////////////////////

// load the map shapes and data
function load_map_data(){
  // remove any shapes that were in the map
  map.eachLayer(function(layer){
    // if the layer has a url, then it is the map tiles and we want to keep this
    // so only remove layers that do not have a url
    if (layer._url == undefined){
      layer.remove();
    }
  });

  // update the info box to show the correct filter selections
  info.update();

  if (data && court_type && case_type && year){
    // get the correct shapes to show
    shapes = eval(court_type.shape_variable);

    // add the data into the shapes
    for (i=0; i < shapes.features.length; i++) {
      // get the data for this shape
      data_item = data[year].find(function(item){
        return item.id == shapes.features[i].properties.id;
      });

      // add the data
      if (data_item){
        shapes.features[i].properties.name = data_item.name;
        shapes.features[i].properties.count = data_item[case_type_id];
      }
    }
  }else{
    console.log('court type not found!')
  }

  // load the shapes and data
  geojson = L.geoJson(shapes, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map);
}

// create case type table
function create_case_type_table(){
  html = '<table data-id="case_type" class="table table-striped table-hover"><thead><tr>';

  // create table headers
  // - court type
  html += '<th>' + locales[current_locale].court_types[court_type.id] + '</th>';
  // - case types
  for(i=0; i < data_case_types.length; i++){
    html += '<th title="' + locales[current_locale].table.click_sort + '">' + locales[current_locale].case_types[data_case_types[i].id] + '</th>';
  }
  html += '</tr></thead><tbody>';

  // add each row
  for(i=0; i < data[year].length; i++){
    row_data = data[year][i];
    html += '<tr>';

    // name
    html += '<td>' + row_data.name + '</td>';

    // case types
    for(j=0; j < data_case_types.length; j++){
      html += '<td>' + row_data[data_case_types[j].id] + '</td>';
    }

    html += '</tr>';
  }

  html += '</tbody></table>';
}

// create year table
function create_year_table(){
  html = '<table data-id="year" class="table table-striped table-hover"><thead><tr>';

  // create table headers
  // - court type
  html += '<th>' + locales[current_locale].court_types[court_type.id] + '</th>';
  // - years
  for(i=0; i < years.length; i++){
    html += '<th title="' + locales[current_locale].table.click_sort + '">' + years[i] + '</th>';
  }
  html += '</tr></thead><tbody>';

  // add each row
  for(i=0; i < data[year].length; i++){
    row_data = data[year][i];
    html += '<tr>';

    // name
    html += '<td>' + row_data.name + '</td>';

    // years
    for(j=0; j < years.length; j++){
      html += '<td>' + data[years[j]][i][case_type_id] + '</td>';
    }

    html += '</tr>';
  }

  html += '</tbody></table>';
}

function create_table_switcher_button(){
  if (table_view_type == 'case_type'){
    return build_button('table_switcher', '', 'year', locales[current_locale].table.view_year, 'table_switcher_click');
  }else if (table_view_type == 'year'){
    return build_button('table_switcher', '', 'case_type', locales[current_locale].table.view_case_type, 'table_switcher_click');
  }

}


// build the data table with the latest data
//TODO - on hover over row - highlight map shape
function update_table(){
  // initialize the table view type if it does not exist
  table_view_type = table_view_type || default_table_view_type;

  if (table_view_type == 'case_type'){
    create_case_type_table();
  }else if (table_view_type == 'year'){
    create_year_table();
  }

  // add the table to the page
  document.getElementById('table').innerHTML = html;

  // update table title
  document.getElementById('table_title').innerHTML = create_table_title();

  // update the table switcher button
  document.getElementById('table_switcher').innerHTML = create_table_switcher_button();

  // enable table sorting
  document.querySelectorAll('thead th').forEach(th => th.addEventListener('click', (() => {
      const tbody = th.closest('table').querySelector('tbody');
      Array.from(tbody.querySelectorAll('tr'))
          .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
          .forEach(tr => tbody.appendChild(tr) );
  })));
}

// update the active status for a set of buttons
function update_button_status(buttons, button_make_active){
  for (i = 0; i < buttons.length; i++) {
    if (buttons[i] == button_make_active){
      // set the active status for this button
      buttons[i].classList.add('active');
    } else {
      // remove the active status for this button
      buttons[i].classList.remove('active');
    }
  }
}

// this function is called when a button is clicked
// get the current button selections
// and then update the map
function update_data(){
  // get the ids of the buttons that are active
  court_type_id = document.querySelector('button.court_type.active').getAttribute('data-id');
  case_type_id = document.querySelector('button.case_type.active').getAttribute('data-id');
  year = document.querySelector('button.year.active').getAttribute('data-id');

  // get a reference to the data objects for the selected items
  court_type = data_court_types.find(function(item){
    return item.id == court_type_id;
  });
  case_type = data_case_types.find(function(item){
    return item.id == case_type_id;
  });

  // get a reference to the data that is to be processed
  data = eval(court_type.data_variable);

}

// update the button active status and then update the map
function update_everything(selector, e){
  // update the active status for these buttons
  buttons = document.querySelectorAll(selector);
  update_button_status(buttons, e);

  // update the data based on the current selections
  update_data();

  // update the map with the correct shapes and data
  load_map_data();

  // update the table with the correct data
  //  - do not need to change the table if the
  //    case type button was pressed and viewing case type table
  //    or when year button is pressed and view year table
  if (!(document.querySelector('table').getAttribute('data-id') == 'case_type' && button_clicked == 'case_type' ||
      document.querySelector('table').getAttribute('data-id') == 'year' && button_clicked == 'year')){

    update_table();
  }

  // update the page title
  update_page_title();

  // update the url with the parameter values
  update_url();
}

//////////////////////////
// functions that are called
// when buttons are clicked
//////////////////////////

// year button was selected
// update the active state for these set of buttons
// update the map
function year_click(e){
  // indicate which button was clicked
  button_clicked = 'year';

  update_everything('button.year', e);
}

// court type button was selected
// update the active state for these set of buttons
// update the map
function court_type_click(e){
  // indicate which button was clicked
  button_clicked = 'court_type';

  update_everything('button.court_type', e);

  // TODO - when court changes, update the case type and year button for they may be different
}

// case type button was selected
// update the active state for these set of buttons
// update the map
function case_type_click(e){
  // indicate which button was clicked
  button_clicked = 'case_type';

  update_everything('button.case_type', e);
}

// table switcher button was selected
// update the table
function table_switcher_click(e){
  // indicate which table view type to show
  table_view_type = e.getAttribute('data-id');

  update_table();
}


//////////////////////////
// function to set the intial values, data, and buttons
//////////////////////////
function initialize_data_and_buttons(){
  //////////////////////////
  // if there are values from the querystring
  // use them as the default values for the buttons
  // that should be selected
  //////////////////////////
  if (urlParams['court_type']){
    tmp_court_type = null;
    tmp_court_type = data_court_types.find(function(item){
      return item.id == urlParams['court_type'];
    });

    // if the court type was found, save the id
    if (tmp_court_type){
      court_type_id = tmp_court_type.id;
    }

    // if the court type was not found, default to region
    if (court_type_id == undefined){
      court_type_id = 'region';
    }
  }

  if (urlParams['case_type']){
    tmp_case_type = null;
    tmp_case_type = data_case_types.find(function(item){
      return item.id == urlParams['case_type'];
    });

    // if the case type was found, save the id
    if (tmp_case_type){
      case_type_id = tmp_case_type.id;
    }

  }

  if (urlParams['year']){
    year = urlParams['year'];
  }

  //////////////////////////
  // get the data we
  // should be working with
  //////////////////////////

  // get the case type
  court_type = data_court_types.find(function(item){
    return item.id == court_type_id;
  });

  // get a reference to the data that is to be processed
  data = eval(court_type.data_variable);


  //////////////////////////
  // if there are any default values that do not exist,
  // set them using values from the data
  // this also includes testing default values that were
  // provided in the url to make sure they exist
  //////////////////////////

  // if the year is defined, make sure it is in the data
  // else if year is not already defined by a default value, get the most recent year in the data
  // the years are automatically sorted so have to use the last key to ge the most recent year
  if ((year && data[year] == undefined) || year == undefined){
    year = Object.keys(data).slice(-1)[0];
  }

  // if case type is defined, make sure it is in the data
  // else if case type is not already defined by a default value, get the first case type in the data
  if ((case_type_id && !Object.keys(data[year][0]).includes(case_type_id)) || case_type_id == undefined){
    // look at the first data item for the year,
    // then look at the 3rd item to get the first case type listed
    case_type_id = Object.keys(data[year][0])[2];
  }
  case_type = data_case_types.find(function(item){
    return item.id == case_type_id;
  });


  //////////////////////////
  // build the filter buttons for each filter
  //////////////////////////

  // first clear out any buttons that might exist
  document.getElementById('filter-court-type').innerHTML = '';
  document.getElementById('filter-case-type').innerHTML = '';
  document.getElementById('filter-year').innerHTML = '';


  // court types
  html = '';
  for(i=0; i<data_court_types.length; i++){
    // determine if this button needs to be highlighted to show that it is currently active
    active = court_type_id == data_court_types[i].id ? 'active' : '' ;
    // build the button
    html += build_button('court_type', active, data_court_types[i].id, locales[current_locale].court_types[data_court_types[i].id], 'court_type_click');
  }
  document.getElementById('filter-court-type').innerHTML = html;

  // years
  // - have to get list of possible years from the data
  years = Object.keys(data).reverse(); // using reverse because the years get sorted and we want the most recent first
  html = '';
  for(i=0; i<years.length; i++){
    // determine if this button needs to be highlighted to show that it is currently active
    active = year == years[i] ? 'active' : '' ;
    // build the button
    html += build_button('year', active, years[i], years[i], 'year_click');
  }
  document.getElementById('filter-year').innerHTML = html;

  // case types
  // - have to get list of possible case types from the data
  case_types = Object.keys(data[year][0])
  // remove the id and name keys since they are not case types
  case_types.splice(0,2);
  html = '';
  for(i=0; i<case_types.length; i++){
    // get a reference to the case type object so we can get the id and name
    tmp_case_type = data_case_types.find(function(item){
      return item.id == case_types[i];
    });

    // determine if this button needs to be highlighted to show that it is currently active
    active = case_type_id == data_case_types[i].id ? 'active' : '' ;
    // build the button
    html += build_button('case_type', active, tmp_case_type.id, locales[current_locale].case_types[tmp_case_type.id], 'case_type_click');
  }
  document.getElementById('filter-case-type').innerHTML = html;
}



//////////////////////////
//////////////////////////
//////////////////////////
// THE FOLLOWING CODE AUTOMATICALLY
// RUNS WHEN THE PAGE IS LOADED
//////////////////////////
//////////////////////////
//////////////////////////

// set the current locale (this is used for the translations)
current_locale = document.documentElement.lang;

// get the url querystring parameters, if they exist
get_url_params();

// initialize the current selections, data, and buttons
initialize_data_and_buttons();

//////////////////////////
//////////////////////////
// create the map
//////////////////////////
//////////////////////////

// define the map object
var map = L.map('map', {scrollWheelZoom: false}).setView([41.35, 74.70], 7);

// load the map tiles
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
  maxZoom: 9,
  id: 'mapbox.light'
}).addTo(map);


// popup control
var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

info.update = function (props) {
  this._div.innerHTML = '<h4>' + create_page_title() + '</h4>' +
    (props ? '<b>' + props.name + '</b>: ' + (props.count ? props.count : locales[current_locale].no_data) : locales[current_locale].hover_map);
};
info.addTo(map);


// get color depending on population count value
function getColor(d) {
          return d > 1000 ? '#67000d' :
                  d > 800  ? '#a50f15' :
                  d > 500  ? '#cb181d' :
                  d > 200  ? '#ef3b2c' :
                  d > 100  ? '#fb6a4a' :
                  d > 50   ? '#fc9272' :
                  d > 20   ? '#fcbba1' :
                  d > 10   ? '#fee0d2' :
                  d > 0    ? '#fff5f0' :
                                       '#ccc';
      }

// set the style for each shape in the map
function style(feature) {
  return {
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7,
    fillColor: getColor(feature.properties.count)
  };
}

// set the style when hovering over the shape
function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(layer.feature.properties);
}

// reset the style when leave the shape
function resetHighlight(e) {
  geojson.resetStyle(e.target);
  info.update();
}

// zoom in the map on the selected shape
function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

// register events for each shape
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

// create the legend
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend'),
                grades = [1, 10, 20, 50, 100, 300, 500, 800, 1000],
                labels = [],
                from, to;

                // add NA label
                labels.push(
                    '<i style="background:' + getColor(0) + '"></i> ' + locales[current_locale].no_data
                );

            for (i = 0; i < grades.length; i++) {
                from = grades[i];
                to = grades[i + 1];

                labels.push(
                    '<i style="background:' + getColor(from+1) + '"></i> ' +
                    from + (to ? '&ndash;' + to : '+'));
            }

  div.innerHTML = labels.join('<br>');
  return div;
};
legend.addTo(map);


// load the shapes and data into the map
load_map_data();

// update the table with the correct data
update_table();

// update the page title
update_page_title();

// update the url with the parameter values
update_url();
