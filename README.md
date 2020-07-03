# ts-analysis
Analysis TypeScript Code to Json

<p align="center">
  <a href="https://www.npmjs.com/package/@midwayjs/ts-analysis" alt="npm version">
    <img src="https://img.shields.io/npm/v/@midwayjs/ts-analysis.svg?style=flat" />
  </a>
  <a href="./LICENSE" alt="GitHub license">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="https://github.com/midwayjs/midway-serverless/actions?query=workflow%3A%22Node.js+CI%22" alt="Node.js CI">
    <img src="https://img.shields.io/badge/Node.js%20CI-passing-brightgreen" />
  </a>
  <a href="https://github.com/midwayjs/ts-analysis" alt="Activity">
    <img src="https://img.shields.io/github/commit-activity/m/midwayjs/ts-analysis" />
  </a>
  <a href="https://github.com/midwayjs/ts-analysis/graphs/contributors" alt="Contributors">
    <img src="https://img.shields.io/github/contributors/midwayjs/ts-analysis" />
  </a>
</p>

## Usage
```ts
// Use Class
import { TsAnalysis } from '@midwayjs/ts-analysis';

async (codePath) => {
  const analysisInstance = new TsAnalysis(codePath);    // 初始化实例
  await analysisInstance.start();                       // 分析器启动
  const result = await analysisInstance.getResult();    // 获取分析结果
  return result;
}

// Use Instance
import { tsAnalysis } from '@midwayjs/ts-analysis';

async (codePath) => {
  const result = await tsAnalysis(codePath)             // 获取分析结果
  return result;
}
```

## Result Demo
### Decorator

```ts
// decorator.ts
@Provider()
class Test {

  constructor(name: string, age: number) {}

  @Inject('context')
  ctx;

  @Func('index.handler', { method: 'GET', path: '/api/test' })
  async handler() { }
}

// result
{
  decorators: {
    Provider: [
      {
        sourceFile: '/Users/xxx/decorator.ts',  // 代码所在位置
        position: {                             // 装饰器所在位置
          start: {                              // 装饰器开始位置
            ln: 0,
            col: 0
          },
          end: {                                // 装饰器结束位置
            ln: 0,
            col: 12
          }
        },
        params: [
          // 参数
        ],
        target: {                               // 装饰的目标
          type: 'class',                        // 目标类型
          name: 'Test',                         // 目标名称
          position: {                           // 目标代码位置
            ... // 格式参照上述位置结构
          },
          params: [                             // 目标参数列表，class即为constructor参数列表
            { 
              name: 'name',
              type: 'string'
            },
            { 
              name: 'age',
              type: 'number'
            }
          ]
        },
        childDecorators: {
          Inject: [
            ... // 结构类似
          ],
          Func: [
            ... // 结构类似
          ]
        }
      }
    ],
    Inject: [
      ... // 结构类似
    ],
    Func: [
      ... // 结构类似
    ]
  }

}
```
