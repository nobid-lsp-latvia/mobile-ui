// SPDX-License-Identifier: EUPL-1.2

import { request } from '@/utils/communicationUtils';
import { APP_CONFIG } from '@/constants';
import { useMockStore } from '@/stores/useMockStore';
import router from '@/router/index';

const mockStore = useMockStore();

const WAIT = 0;

export async function scanQrCode() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        router.push({ name: 'documentPresentation' });
        resolve(data);
      }, WAIT);
    });
  } else {
    await request('presentation', 'scanQrCode', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getRequestDocuments() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.getRequestDocuments.response.data);
      }, WAIT);
    });
  } else {
    await request('presentation', 'getRequestDocuments', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function updateField(id, checked) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, WAIT);
    });
  } else {
    const paramObj = {
      id,
      checked,
    };
    await request('presentation', 'updateField', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function confirmRequest(fields) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        data = { redirectUrl: '/dashboard' };
        resolve(data);
      }, WAIT);
    });
  } else {
    // 2 min timeout
    await request('presentation', 'confirmRequest', fields, undefined, 120000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function presentationCanceled() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        console.log('presentationCanceled');
        resolve(data);
      }, WAIT);
    });
  } else {
    await request('presentation', 'presentationCanceled', null, undefined, 10000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}
