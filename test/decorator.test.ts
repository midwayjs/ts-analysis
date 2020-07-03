import { tsAnalysisInstance } from '../src';
import { resolve } from 'path';
import * as assert from 'assert';
describe('/test/code.test.ts', () => {
  it('analysis', async () => {
    const result = await tsAnalysisInstance(resolve(__dirname, './fixtures/decorator'));
    assert(result.decorator.Provider[0].target.type === 'class');
    assert(result.decorator.Provider[0].target.name === 'Test');
    assert(result.decorator.Provider[0].childDecorators.Func[0].target.type === 'method');
    assert(result.decorator.Provider[0].childDecorators.Func[0].target.name === 'handler');
    assert(result.decorator.Func[0].parent.Provider[0].target.name === 'Test');
  });
});
