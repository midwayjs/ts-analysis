import * as ts from 'typescript';
import { existsSync, statSync, readFileSync } from 'fs';
import{ globx } from './utils/globx';
export class TsAnalysis {
  sourcePath: string;
  checker: ts.TypeChecker;
  result: any = {};
  constructor(sourcePath: string) {
    this.sourcePath = sourcePath;
    this.result.decorator = {};

    /*
    decorator: {
      Provider: [
        {
          path: 'xxxxx',
          args: [],
          parent: [],
          children: []
        }
      ],
      Func: [
        {
          path: '',
          args: [],
          parent: [],
          children: []
        }
      ]
    }
    */
  }

  async start() {
    try {
      this.startAnalysis();
    } catch (e) {
      throw e;
    }
  }

  startAnalysis() {
    // 分析函数
    if (!existsSync(this.sourcePath)) {
      return;
    }

    let rootNames = [this.sourcePath];
    if (statSync(this.sourcePath).isDirectory()) {
      rootNames = globx(this.sourcePath, 2, ['.ts']);
    }
    // Build a program using the set of root file names in fileNames
    const compilerOptions = this.getTsConfigInfo();
    let program = ts.createProgram(rootNames, compilerOptions);
    this.checker = program.getTypeChecker();
    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        ts.forEachChild(sourceFile, this.visit.bind(this));
      }
    }
  }

  visit(node: ts.Node, parent?:any) {
    if (!node.decorators) {
      return;
    }
    
    const sourceFile: ts.SourceFile = node.getSourceFile();
    const path = sourceFile.fileName;
    const nodeInfo = {
      path
    };
    const currentDecorators = [];
    node.decorators.forEach(decorator => {
      if (ts.isCallExpression(decorator.expression)) {
        const decoratorInfo = this.getDecoratorInfo(decorator, nodeInfo);
        if (decoratorInfo) {
          decoratorInfo.node = {
            pos: {
              start: node.pos,
              end: node.end
            }
          };
          currentDecorators.push(decoratorInfo);
        }
      }
    });
    if (parent && Array.isArray(parent)) {
      parent.forEach(decoInfo => {
        decoInfo.children = currentDecorators;
      });
    }
    // 如果是类，还要分析属性
    if (ts.isClassDeclaration(node)) {
      const symbol = this.checker.getSymbolAtLocation((node as any).name);
      // symbol.members 为获取所有的属性方法
      if (symbol && symbol.members) {
        symbol.members.forEach(member => {
          if (member && member.declarations && member.declarations[0]) {
            this.visit(member.declarations[0], currentDecorators);
          }
        });
      }
    }
  }

  // 获取装饰器信息
  getDecoratorInfo(decorator, info?, parent?) {
    if (ts.isCallExpression(decorator.expression)) {
      const expression: any = decorator.expression;
      if (!expression.expression) {
        return;
      }
      let args = [];
      if (expression.arguments && expression.arguments.length) {
        args = this.formatArgs(expression.arguments);
      }
      const type = expression.expression.escapedText.toLowerCase();
      if (!this.result.decorator[type]) {
        this.result.decorator[type] = [];
      }
      const decoratorInfo = {
        type,
        info,
        args,
        parent,
        node: {},
        pos: {
          start: decorator.pos,
          end: decorator.end,
          cursor: this.getCursorInfo(info.path, decorator.end)
        },
        children: []
      };
      this.result.decorator[type].push(decoratorInfo);
      return decoratorInfo;
    }
  }


  getCursorInfo(path, endPos) {
    try {
      const code = readFileSync(path).toString().substr(0, endPos).split('\n');
      const line = code.length - 1;
      return {
        line,
        index: code[line].length
      };
    } catch (e) {
      return { line: 0, index: 0 };
    }
  }

  // 格式化装饰器参数
  formatArgs(args) {
    return args.map((arg) => {
      if (arg.name) {
        return arg.name.escapedText;
      }
      if (arg.text) {
        return arg.text;
      }
      if (arg.symbol) {
        const symbol = this.getParam(arg.symbol);
        return symbol;
      }
      if (arg.elements) {
        return this.formatArgs(arg.elements);
      }
      return '';
    });
  }

  // 获取参数信息
  getParam(symbol: ts.Symbol) {
    const type = this.getType(symbol);
    const valueDeclaration: any = symbol.valueDeclaration as any;
    if (type === 'string') {
      if (valueDeclaration.initializer) {
        if (valueDeclaration.initializer.text) {
          return valueDeclaration.initializer.text;
        } else if (valueDeclaration.initializer.name) {
          return valueDeclaration.initializer.name.escapedText;
        }
        return '';
      }
    }
    const param: any = {};
    if (symbol.members) {
      symbol.members.forEach((value, key) => {
        param[key as string] = this.getParam(value);
      });
    }
    return param;
  }

   // 获取类型
   getType(symbol) {
    const checkerType: any = this.checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration
    );
    return this.checker.typeToString(checkerType).toLowerCase();
  }


  serializeType(checkerType: any): any {
    let parameter: any = {};
    const checker: any = this.checker;
    const type = this.checker.typeToString(checkerType).toLowerCase();
    if (checkerType.value !== undefined) {
      parameter.type = typeof checkerType.value;
      parameter.fixed = checkerType.value;
    } else if (['string', 'number', 'boolean', 'any', 'object', 'array'].indexOf(type) !== -1) {
      parameter.type = type;
    } else if (['true', 'false'].indexOf(type) !== -1) {
      parameter.type = 'boolean';
      parameter.fixed = type === 'true';
    } else if (checkerType.isClassOrInterface()) {
      parameter.type = 'object';
      parameter.properties = {};
      checkerType
        .getProperties()
        .map(symbol => this.getParam(symbol))
        .forEach(item => {
          parameter.properties[`${item.name}`] = item;
        });
    } else if (checkerType.isUnion()) {
      //boolean 也是union类型了
      if ((checkerType as any).intrinsicName === 'boolean') {
        parameter.type = 'boolean';
      } else if (checkerType.symbol && checkerType.symbol.valueDeclaration.kind === 244) {
        //枚举类型244
        parameter.type = 'int32';
        parameter.enum = checkerType.types.map((item: any) => {
          return {
            label: item.symbol.getName(),
            value: item.value,
          };
        });
      } else {
        let type = '';
        parameter['$oneof'] = checkerType.types.map(item => {
          const childType = this.serializeType(item);
          if (!type) {
            type = childType.type;
          } else if (type !== childType.type) {
            type = 'any';
          }
          return childType;
        });
        parameter.type = type || 'any';
      }
    } else if (checker.isArrayType && checker.isArrayType(checkerType)) {
      // 如果是数组
      parameter.type = 'array';
      //TODO: 找不到对应的方法获取属性值
      const itemType = (checkerType as any).typeArguments.map((item: any) => {
        return this.serializeType(item as any);
      });
      parameter.items = {
        ...itemType[0], //默认取第一个
      };
      //数组判断
    } else if (checker.getPromisedTypeOfPromise && checker.getPromisedTypeOfPromise(checkerType)) {
      // 如果是 promise
      const promiseType = checker.getPromisedTypeOfPromise(checkerType) as ts.Type;
      return this.serializeType(promiseType);
    } else {
      
      if (checkerType.getProperties) {
        const properties = checkerType.getProperties();
        if (properties && properties.length) {
          parameter.type = 'object';
          parameter.properties = {};
          properties.map(symbol => this.getParam(symbol)).forEach(item => {
            parameter.properties[`${item.name}`] = item;
          });
          return parameter;
        }
      } else {
        parameter.type = type;
      }
    }
    return parameter;
  }

  // 获取ts配置
  getTsConfigInfo() {
    return {};
  }

  // 获取分析结果
  getResult() {
    return this.result;
  }
}

export const tsAnalysisInstance = async path => {
  const analysisInstance = new TsAnalysis(path);
  await analysisInstance.start();
  return analysisInstance.getResult();
};