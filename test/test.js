const path = require('path');
const Promise = require('bluebird');
const { test } = require('ava');
const {
  loadFileInfoAsync,
  addPrettySize,
  addMimeTypeInfo,
  addImageInfo,
  addPrettyDateInfo,
  addGzipSize,
} = require('../index');

const fixturePath = path.resolve(__dirname, 'fixture.txt');
const imagePath = path.resolve(__dirname, 'fixture.jpg');
const errorPath = path.resolve(__dirname, 'notfound.txt');

test('Load file', Promise.coroutine(function* tryLoadFile(t) {
  t.plan(4);
  const msg = 'loadFileInfoAsync() should read the file metadata';
  const {
    absolutePath,
    size,
    dateCreated,
    dateChanged,
  } = yield loadFileInfoAsync(fixturePath);
  console.log(dateCreated); // eslint-disable-line no-console
  t.deepEqual(absolutePath, fixturePath, msg);
  t.deepEqual(size, 574, msg);
  t.truthy(dateCreated, msg);
  t.truthy(dateChanged, msg);
}));

test('Invalid filepath', Promise.coroutine(function* tryLoadFile(t) {
  t.plan(1);
  const msg = 'loadFileInfoAsync() should throw error if passed an invalid filepath argument';
  try {
    yield loadFileInfoAsync(null);
  } catch (e) {
    t.deepEqual('Please provide a valid filepath', e.message, msg);
  }
}));

test('File does not exist', Promise.coroutine(function* tryLoadFile(t) {
  t.plan(1);
  const msg = 'loadFileInfoAsync() should throw error if trying to load an unexistent file';
  try {
    yield loadFileInfoAsync(errorPath);
  } catch (e) {
    t.pass(msg);
  }
}));

test('Add pretty size', (t) => {
  t.plan(6);
  const msg = 'addPrettySize() should add the scaled size';
  // Zero-bytes case
  const zero = addPrettySize({ size: 0 }, {});
  t.deepEqual(zero.prettySize, '0 bytes', msg);
  // 1-byte case
  const one = addPrettySize({ size: 1 }, {});
  t.deepEqual(one.prettySize, '1 byte', msg);
  // Small case (Kibibyte)
  const smallKibi = addPrettySize({ size: 574 }, { useKibibyteRepresentation: true });
  t.deepEqual(smallKibi.prettySize, '574 bytes', msg);
  // Large case (Kibibyte)
  const largeKibi = addPrettySize({ size: 1073741824 }, { useKibibyteRepresentation: true });
  t.deepEqual(largeKibi.prettySize, '1 GiB', msg);
  // Small case (SI)
  const small = addPrettySize({ size: 574 }, { useKibibyteRepresentation: false });
  t.deepEqual(small.prettySize, '574 bytes', msg);
  // Large case (SI)
  const large = addPrettySize({ size: 1073741824 }, { useKibibyteRepresentation: false });
  t.deepEqual(large.prettySize, '1.07 GB', msg);
});

test('Add mime type', (t) => {
  const msg = 'addMimeType() should add the mime type info about the file';
  const fileObject = {
    absolutePath: fixturePath,
  };
  const { mimeType } = addMimeTypeInfo(fileObject);
  const expected = 'text/plain';
  t.deepEqual(mimeType, expected, msg);
});

test('Add image info', (t) => {
  t.plan(2);
  const msg = 'addImageInfo() should add dimmensions only if it is an image';
  const { dimmensions } = addImageInfo({ absolutePath: imagePath, mimeType: 'image/jpeg' });
  // Dimmensions should be present
  const expected = {
    width: 640,
    height: 640,
    type: 'jpg',
  };
  t.deepEqual(dimmensions, expected, msg);
  // Not an image, pass through fileObject
  const result = addImageInfo({ absolutePath: fixturePath, mimeType: 'text/plain' });
  t.falsy(result.dimmensions, msg);
});

test('Add pretty date info', (t) => {
  t.plan(4);
  const msg = 'addPrettyDateInfo() should add human readable dates for dateCreated and dateChanged';
  const originalDates = {
    dateCreated: '2017-01-10T11:08:48.000Z',
    dateChanged: '2017-01-10T11:10:00.000Z',
  };
  // 12-hour format
  const hour12 = addPrettyDateInfo(originalDates, { use24HourFormat: false });
  t.truthy(hour12.prettyDateCreated, msg);
  t.truthy(hour12.prettyDateChanged, msg);
  // 24-hour format
  const hour24 = addPrettyDateInfo(originalDates, { use24HourFormat: true });
  t.truthy(hour24.prettyDateCreated, msg);
  t.truthy(hour24.prettyDateChanged, msg);
});

test('Add gzip size', (t) => {
  t.plan(2);
  const msg = 'addGzipSize() should add the gzip pretty size properly scaled';
  // Show in Kibibyte form
  const kibi = addGzipSize({ absolutePath: imagePath }, { useKibibyteRepresentation: true });
  t.deepEqual(kibi.gzipSize, '106.83 KiB', msg);
  // Show in SI
  const si = addGzipSize({ absolutePath: imagePath }, { useKibibyteRepresentation: false });
  t.deepEqual(si.gzipSize, '109.4 kB', msg);
});
