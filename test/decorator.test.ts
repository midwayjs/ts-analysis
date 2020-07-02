import { tsAnalysisInstance } from '../src';
import { resolve } from 'path';
import * as assert from 'assert';
describe('/test/code.test.ts', () => {
  it('compareFileChange', async () => {
    const result = await tsAnalysisInstance(resolve(__dirname, './fixtures/decorator'));
    console.log('result', result);
    assert(true);
  });
});
