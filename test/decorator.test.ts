import { tsAnalysisInstance } from '../src';
import { resolve } from 'path';
import * as assert from 'assert';
describe('/test/index.test.ts', () => {
  it('analysis', async () => {
    const result = await tsAnalysisInstance([resolve(__dirname, './fixtures/baseApp')], { decoratorLowerCase: true });
    assert(result.decorator.provide && result.decorator.func);
  });
});
