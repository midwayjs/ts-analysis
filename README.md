# ts-analysis
TypeScript Code Analysis


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
