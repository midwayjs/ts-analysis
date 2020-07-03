import * as ts from 'typescript';
import { globx } from './utils/globx';

import { ITsAnalysisResult, ITsDecoratorInfo, ITsDecorator, ITsNode } from './interface';
export * from './interface';

export class TsAnalysis {

  private sourcePath: string | string[];
  private result: ITsAnalysisResult = this.initResult();
  private checker: ts.TypeChecker;

  constructor(sourcePath: string | string[]) {
    this.sourcePath = sourcePath;
  }

  public async start(): Promise<void> {
    // get all ts code
    const rootNames =  globx(this.sourcePath, 2, ['.ts']);
    // Build a program using the set of root file names in fileNames
    const compilerOptions = this.getTsConfigInfo();
    const program = ts.createProgram(rootNames, compilerOptions);
    this.checker = program.getTypeChecker();
    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        ts.forEachChild(sourceFile, this.visit.bind(this));
      }
    }
    return;
  }

  public async getResult(): Promise<ITsAnalysisResult> {
    return this.result;
  }

  // visit node, get node info
  private visit(node: ts.Node, parent?: any) {
    const currentInfo: ITsAnalysisResult = this.initResult();
    const target: ITsNode = this.analysisNode(node);
    if (node.decorators) {
      currentInfo.decorator = this.analysisDecorator(node, target, parent?.decorator);
      this.assignDecoratorsToResult(currentInfo.decorator, this.result.decorator);
    }

    // 如果是类，还要分析属性
    if (target.type === 'class') {
      const symbol = this.checker.getSymbolAtLocation((node as any).name);
      // symbol.members 为获取所有的属性方法
      if (symbol?.members) {
        symbol.members.forEach((member: ts.Symbol) => {
          if (member?.declarations?.[0]) {
            this.visit(member.declarations[0], currentInfo);
          }
        });
      }
    }
  }

  private getSourceFileText(nodeOrigin: ts.Node) {
    let node = nodeOrigin;
    while (!ts.isSourceFile(node) && node.parent) {
      node = node.parent;
    }
    return node.getText();
  }

  private analysisNode(node: ts.Node) {
    let type = '';
    let params;
    let response;
    const name = (node as any)?.name?.escapedText || '';
    const code = this.getSourceFileText(node);
    if (ts.isClassDeclaration(node)) {
      type = 'class';
    } else if (ts.isMethodDeclaration(node)) {
      type = 'method';
      params = node.parameters.map((param) => {
        const symbolParams = this.checker.getSymbolAtLocation(param.name);
        return this.getParamType(symbolParams);
      });
      const symbol = this.checker.getSymbolAtLocation((node as any).name);
      const { checkerType } = this.getType(symbol);
      const signatures = checkerType.getCallSignatures()[0];
      response = this.serializeType(signatures.getReturnType());
    } else if (ts.isConstructorDeclaration(node)) {
      type = 'constructor';
    } else if (ts.isPropertyDeclaration(node)) {
      type = 'property';
    } else {
      // console.log('flags--', node.kind, node);
    }

    const target: ITsNode = {
      type,
      name,
      params,
      response,
      position: {
        start: this.getPosition(code, node.pos),
        end: this.getPosition(code, node.end),
      },
    };

    return target;
  }

  // analysis decorator
  private analysisDecorator(node: ts.Node, target, parent?: ITsDecorator) {
    const sourceFile: ts.SourceFile = node.getSourceFile();
    const sourceInfo = {
      sourceFile: sourceFile.fileName,
    };
    const currentDecoratorTypeMap: ITsDecorator = {};
    node.decorators.forEach((decorator: ts.Decorator) => {
      if (ts.isCallExpression(decorator.expression)) {
        const expressionInfo = this.getExpressionInfo(node, decorator.expression, sourceInfo);
        if (expressionInfo) {
          const name = expressionInfo.expressionName;
          const decoratorInfo: ITsDecoratorInfo = {
            name,
            target,
            sourceFile: sourceInfo.sourceFile,
            params: expressionInfo.params,
            position: expressionInfo.position,
            parent,
          };
          // insert into result map
          if (!currentDecoratorTypeMap[name]) {
            currentDecoratorTypeMap[name] = [];
          }
          currentDecoratorTypeMap[name].push(decoratorInfo);
        }
      }
    });
    if (parent) {
      Object.keys(parent).forEach((parentDecoName) => {
        const decoList = parent[parentDecoName];
        if (Array.isArray(decoList)) {
          decoList.forEach((decoInfo: ITsDecoratorInfo) => {
            if (!decoInfo.childDecorators) {
              decoInfo.childDecorators = {};
            }
            this.assignDecoratorsToResult(currentDecoratorTypeMap, decoInfo.childDecorators);
          });
        }
      });
    }
    return currentDecoratorTypeMap;
  }

  // 作用: 获取表达式的详细信息
  private getExpressionInfo(node: ts.Node, expression, sourceInfo) {
    if (!expression?.expression || !ts.isCallExpression(expression)) {
      return;
    }
    const code = this.getSourceFileText(node);

    let params = [];
    if (expression.arguments?.length) {
      params = this.formatParams(expression.arguments);
    }
    const expressionName: string = (expression.expression as ts.Identifier).escapedText.toString();
    return {
      expressionName,
      params,
      position: {
        start: this.getPosition(code, expression.pos),
        end: this.getPosition(code, expression.end),
      },
    };
  }

  // 作用：合并装饰器结果到总结果上
  private assignDecoratorsToResult(currentDecoratorTypeMap: ITsDecorator, target: ITsDecorator) {
    Object.keys(currentDecoratorTypeMap).forEach((decoratorName: string) => {
      if (!target[decoratorName]) {
        target[decoratorName] = [];
      }
      target[decoratorName].push(...currentDecoratorTypeMap[decoratorName]);
    });
  }

  private getPosition(code, pos) {
    try {
      const codeArr: string[] = code.substr(0, pos).split('\n');
      const ln = codeArr.length - 1;
      return {
        ln,
        col: codeArr[ln]?.length || 0,
      };
    } catch (e) {
      return { ln: 0, col: 0 };
    }
  }

  // 作用：转换入参格式到值
  private formatParams(args) {
    return args.map((arg) => {
      if (arg.name) {
        return arg.name.escapedText;
      }
      if (arg.text) {
        return arg.text;
      }
      if (arg.symbol) {
        const symbol = this.getParamValule(arg.symbol);
        return symbol;
      }
      if (arg.elements) {
        return this.formatParams(arg.elements);
      }
      return '';
    });
  }

  // 作用：获取参数值
  private getParamValule(symbol: ts.Symbol) {
    const { type } = this.getType(symbol);
    const valueDeclaration: any = symbol.valueDeclaration as any;
    if (type === 'string') {
      if (valueDeclaration.initializer) {
        return valueDeclaration.initializer?.text || valueDeclaration.initializer?.name?.escapedText || '';
      }
    }
    const param: any = {};
    if (symbol.members) {
      symbol.members.forEach((value, key) => {
        param[key as string] = this.getParamValule(value);
      });
    }
    return param;
  }

  // 作用：获取参数类型
  private getParamType(symbol: ts.Symbol) {
    const checkerType = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    const parameter = {
      ...this.serializeType(checkerType),
      name: symbol?.getName?.() || '',
      desc: ts.displayPartsToString(symbol.getDocumentationComment(this.checker)),
    };
    return parameter;
  }

  private serializeType(checkerType: ts.Type): any {
    const parameter: any = {};
    const checker: any = this.checker;
    const type = this.checker.typeToString(checkerType).toLowerCase();
    if ((checkerType as any).value !== undefined) {
      parameter.fixed = (checkerType as any).value;
      parameter.type = typeof parameter.fixed;
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
        .map((symbol: ts.Symbol) => this.getParamType(symbol))
        .forEach((item: any) => {
          parameter.properties[`${item.name}`] = item;
        });
    } else if (checkerType.isUnion()) {
      // boolean 也是union类型了
      if ((checkerType as any).intrinsicName === 'boolean') {
        parameter.type = 'boolean';
      } else if (checkerType.symbol && checkerType.symbol.valueDeclaration.kind === 244) {
        // 枚举类型244
        parameter.type = 'int32';
        parameter.enum = checkerType.types.map((item: any) => {
          return {
            label: item.symbol.getName(),
            value: item.value,
          };
        });
      } else {
        let oneType = '';
        parameter.$oneof = checkerType.types.map((item: ts.Type) => {
          const childType = this.serializeType(item);
          if (!type) {
            oneType = childType.type;
          } else if (type !== childType.type) {
            oneType = 'any';
          }
          return childType;
        });
        parameter.type = oneType || 'any';
      }
    } else if (checker.isArrayType && checker.isArrayType(checkerType)) {
      // 如果是数组
      parameter.type = 'array';
      // TODO: 找不到对应的方法获取属性值
      const itemType = (checkerType as any).typeArguments.map((item: any) => {
        return this.serializeType(item as any);
      });
      parameter.items = {
        ...itemType[0], // 默认取第一个
      };
      // 数组判断
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
          properties.map((symbol: ts.Symbol) => this.getParamType(symbol)).forEach((item) => {
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

  private getType(symbol: ts.Symbol) {
    const checkerType: ts.Type = this.checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration,
    );
    return {
      type: this.checker.typeToString(checkerType).toLowerCase(),
      checkerType,
    };
  }

  // 作用: 初始化结果
  private initResult(): ITsAnalysisResult {
    return {
      decorator: {},
    };
  }

  // get typescript config object
  private getTsConfigInfo() {
    return {};
  }
}

export const tsAnalysisInstance: (sourcePath: string | string[]) => Promise<ITsAnalysisResult> = async (sourcePath: string | string[]) => {
  const analysisInstance = new TsAnalysis(sourcePath);
  await analysisInstance.start();
  return analysisInstance.getResult();
};
