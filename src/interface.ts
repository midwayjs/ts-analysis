export interface ITsAnalysisResult {
  decorator: ITsDecorator;
}

export interface ITsDecorator {
  [decoratorName: string]: ITsDecoratorInfo[];
}

export interface ITsDecoratorInfo {
  name: string;
  sourceFile: string;
  params: any[];
  position: ITsPositoin;
  target: ITsNode;
  parent?: ITsDecorator;
  childDecorators?: {
    [decoratorName: string]: ITsDecoratorInfo[];
  };
}

export interface ITsPositoin {
  start: {
    ln: number;
    col: number
  };
  end: {
    ln: number;
    col: number
  };
}

export interface ITsNode {
  type: string;
  name: string;
  position: ITsPositoin;
  params?: any[];
  response?: any;
}
