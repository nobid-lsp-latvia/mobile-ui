// SPDX-License-Identifier: EUPL-1.2

/* eslint-disable no-param-reassign -- for status code reassignment */
const initActiveSession = {
  sid: '01GNA1X4QQ0D0D6N7D1XAHD610',
  active: true,
  st: 'authorized',
  code: '24107077996',
  family_name: 'ALEKS',
  given_name: 'EGLE',
  org_name: 'Daugavpils reģionālā slimnīca, Sabiedrība ar ierobežotu atbildību',
  org_id: '41503029600',
  specialty: '24107077996',
  roles: ['AR_Doctor'],
  secondsToLive: 3599,
  secondsToCountdown: 300,
  isSessionExtendable: true,
};

const activeSession = { ...initActiveSession };

let authorized = true;

module.exports = [
  {
    pattern: '/mock-api-auth/api/1.0/session/keep-alive',
    method: 'GET',
    handle: (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (authorized) {
        res.end(JSON.stringify(activeSession));
      }
      res.statusCode = 401;
      res.end();
    },
  },
  {
    pattern: '/mock-api-auth/api/1.0/session',
    method: 'GET',
    handle: (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (authorized) {
        res.end(JSON.stringify(activeSession));
      }
      res.statusCode = 401;
      res.end();
    },
  },
  {
    pattern: '/mock-api-auth/api/1.0/session',
    method: 'DELETE',
    handle: (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      authorized = false;
      res.end();
    },
  },
];
