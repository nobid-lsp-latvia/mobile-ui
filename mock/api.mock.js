// SPDX-License-Identifier: EUPL-1.2

/* eslint-disable no-underscore-dangle -- for parsing query arguments */
const autocompleteTestData = [
  {
    id: 'jp',
    name: 'Pikaču',
  },
  {
    id: 'ar',
    name: 'Charizard',
  },
  {
    id: 'br',
    name: 'Mewtwo',
  },
  {
    id: 'lv',
    name: 'Squirtle ',
  },
  {
    id: 'mt ',
    name: 'Gyarados ',
  },
  {
    id: 'ma ',
    name: 'Bulbasaur ',
  },
];

const autocompletePreselected = autocompleteTestData[1].id;
const autocompletePreselectedFunc = autocompleteTestData[2];

module.exports = [
  {
    pattern: '/mock-api/api/1.0/classifier/autocomplete-test**',
    method: 'GET',
    handle: (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const query = new URLSearchParams(req._parsedUrl.query).get('query');
      res.end(
        JSON.stringify(
          autocompleteTestData.filter((item) =>
            item.name.toLowerCase().includes(query.toLowerCase())
          )
        )
      );
    },
  },
  {
    pattern: '/mock-api/api/1.0/user-settings',
    method: 'GET',
    handle: (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      // Simulate slow response
      setTimeout(() => {
        res.end(
          JSON.stringify({
            savedValues: {
              autocompletePreselected,
              autocompletePreselectedFunc,
            },
          })
        );
      }, 5000);
    },
  },
];
