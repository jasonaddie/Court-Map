# Court Map

This project is an interactive map that shows the type of cases that the courts have had over time and at each level of court (district, region, and country).

# Layout of content
The site is split into 3 languages: Kyrgyz, Russian, and English. Each language has its own html file in the corresponding language folder. The javascript and css files are shared among all three languages.

The code is built in a way such that only the data files in the `assets` folder need to be updated. No other code should need to be updated.

The files in the `assets` folder that start with `shapes_` are the files that contain the shape outlines to load into the map. Ideally these should never need to be changed.

## To update text
Some text is in the `index.html` file of each language folder and some is in the `translations.js` file. The `index.html` files contain the text that never changes while interacting with the page (i.e., filter labels, intro text, etc.) and the meta tag text. The `translations.js` contains the text that is added through javascript (i.e., the filter button text, table header text, etc.).

To update the text, simply update the `index.html` files and/or the `translations.js` file.

## To update data
The spreadsheet data is located in the `data` folder where there is a file for country, regions, and districts. Each data file contains a tab for each year of data. It is important that the headers for the case type columns be consistent throughout all spreadsheets. It is also important that the column headers for the filters match the id value for the `data_case_types` variable located in `assets/data_settings.js`.

This data needs to be converted to a JSON format and then put into the corresponding data js files (`data_country`, `data_regions`, `data_districts`) in the `assets` folder. You can do this using an online CSV to JSON converter like http://www.csvjson.com/csv2json.

The `assets` folder has a `data_settings` file that is used to record the settings for the court types and case types. The case type id values must match the column headers from the spreadsheet in order for the site to work.

## To add new filter
The process of adding a a new filter requires a few steps.
* Update the `data_settings.js` file in the `assets` folder by adding the id of the new filter to `data_case_types` variable.
* Update the `translations.js` file in the `assets` folder by adding a record for the new filter to `case_types` for each language.
* Add the filter as a new column in the spreadsheets located in the `data` folder. The column name must match the id that you entered in the first step.
* Convert the spreadsheet data to json data and put into the appropriate `data_xxx.js` file in the `assets` folder.

That is it. You do not need to touch the `main.js` file at all. You may need to update the `main.css` file if there are too many fitlers and they no longer fit on the page in one row.


# File Permissions
chmod +rX -R
