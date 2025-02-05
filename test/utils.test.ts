import test from 'tape';
import nock from 'nock';
import toReadableStream from 'to-readable-stream';
import { stat as statCallback, unlinkSync } from 'node:fs';
import { platform } from 'node:os';
import { promisify } from 'node:util';
import {
  areObjectsEqual,
  downloadToFile,
  parsePathAndFormat,
} from '../src/utils';

const stat = promisify(statCallback);

test('🛠 setup', (t) => {
  nock.disableNetConnect();
  if (!nock.isActive()) nock.activate();
  t.end();
});

test('🧪 areObjectsEqual() should correctly check object equality', (t) => {
  t.plan(1);
  const obj1 = {
    a: 1,
    b: true,
    c: null,
    d: undefined,
    45: -45.223232323,
  };
  t.true(
    areObjectsEqual(obj1, { ...obj1 }),
    'objects should be compared correctly.',
  );
  t.end();
});

test('🧪 downloadToFile() should download the give URL and write to given file location with given mode.', async (t) => {
  t.plan(1);
  const filePath = './test.sh';
  nock('http://localhost.test')
    .get('/dummy-cc-reporter')
    .reply(200, () => {
      return toReadableStream(`#!/bin/bash
echo "hello"
`);
    });
  await downloadToFile(
    'http://localhost.test/dummy-cc-reporter',
    filePath,
    0o777,
  );
  const stats = await stat(filePath);
  t.equal(
    stats.mode,
    platform() === 'win32' ? 33206 : 33261,
    'downloaded file should exist and have executable permissions on valid platforms.',
  );
  unlinkSync(filePath);
  nock.cleanAll();
  t.end();
});

test(
  '🧪 parsePathAndFormat() should correctly parse path patterns and formats correctly on Windows.',
  {
    skip: platform() !== 'win32',
  },
  async (t) => {
    t.plan(1);
    const fixture =
      'C:\\Users\\gp\\Projects\\codeclimate-action\\test\\*.lcov:lcov' as const;
    const expected = {
      format: 'lcov',
      pattern: 'C:\\Users\\gp\\Projects\\codeclimate-action\\test\\*.lcov',
    };
    const result = parsePathAndFormat(fixture);
    t.deepEqual(
      result,
      expected,
      'path patterns and formats should be correctly parsed on Windows',
    );
    t.end();
  },
);

test(
  '🧪 parsePathAndFormat() should correctly parse path patterns and formats correctly on macOS.',
  {
    skip: platform() !== 'darwin',
  },
  async (t) => {
    t.plan(1);
    const fixture =
      '/Users/gp/Projects/codeclimate-action/test/*.lcov:lcov' as const;
    const expected = {
      format: 'lcov',
      pattern: '/Users/gp/Projects/codeclimate-action/test/*.lcov',
    };
    const result = parsePathAndFormat(fixture);
    t.deepEqual(
      result,
      expected,
      'path patterns and formats should be correctly parsed on macOS',
    );
    t.end();
  },
);

test(
  '🧪 parsePathAndFormat() should correctly parse path patterns and formats correctly on Linux.',
  {
    skip: platform() !== 'linux',
  },
  async (t) => {
    t.plan(1);
    const fixture =
      '/Users/gp/Projects/codeclimate-action/test/*.lcov:lcov' as const;
    const expected = {
      format: 'lcov',
      pattern: '/Users/gp/Projects/codeclimate-action/test/*.lcov',
    };
    const result = parsePathAndFormat(fixture);
    t.deepEqual(
      result,
      expected,
      'path patterns and formats should be correctly parsed on Linux',
    );
    t.end();
  },
);

test('💣 teardown', (t) => {
  nock.restore();
  nock.cleanAll();
  nock.enableNetConnect();
  if (process.exitCode === 1) process.exitCode = 0; // This is required because @actions/core `setFailed` sets the exit code to 0 when we're testing errors.
  t.end();
});
