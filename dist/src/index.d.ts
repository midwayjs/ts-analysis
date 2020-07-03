import { ITsAnalysisResult } from './index.d';
export declare class TsAnalysis {
    private sourcePath;
    private result;
    private checker;
    constructor(sourcePath: string | string[]);
    start(): Promise<void>;
    getResult(): Promise<ITsAnalysisResult>;
    private visit;
    private getSourceFileText;
    private analysisNode;
    private analysisDecorator;
    private getExpressionInfo;
    private assignDecoratorsToResult;
    private getPosition;
    private formatParams;
    private getParamValule;
    private getParamType;
    private serializeType;
    private getType;
    private initResult;
    private getTsConfigInfo;
}
export declare const tsAnalysisInstance: (sourcePath: string) => Promise<ITsAnalysisResult>;
